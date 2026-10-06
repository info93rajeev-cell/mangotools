import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { paintQuantityV2 } from './operation.ts';

const room = {
  mode: 'room',
  unit: 'm',
  roomLength: '4',
  roomWidth: '3',
  roomHeight: '2.7',
  includeCeiling: 'false',
  quantity: '1',
  coats: '2',
  coverage: '10',
  coverageUnit: 'm2-per-l',
  wastagePercent: '10',
};

const roof = {
  mode: 'roof',
  unit: 'm',
  roofLength: '10',
  roofWidth: '8',
  pitchAngle: '30',
  quantity: '1',
  coats: '1',
  coverage: '10',
  coverageUnit: 'm2-per-l',
  wastagePercent: '0',
  decimalPlaces: '3',
};

async function value(input: Record<string, unknown>) {
  const result = await executeOperation(paintQuantityV2, input, {}, createTestContext());
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

describe('civil.paint.quantity@2', () => {
  it('adds the ceiling only when asked', async () => {
    expect((await value(room)).grossAreaM2).toBe('37.80');
    expect((await value({ ...room, includeCeiling: true })).grossAreaM2).toBe('49.80');
  });

  it('preserves the existing single-surface result', async () => {
    const result = await value({
      ...room,
      mode: 'surface',
      length: '5',
      secondDimension: '4',
      openings: [{ width: '1', height: '2', quantity: '1' }],
    });
    expect(result.netAreaM2).toBe('18.00');
    expect(result.orderLitres).toBe('3.96');
  });

  it('uses plan area at 0° and plan area ÷ cos(pitch) at 30°', async () => {
    expect((await value({ ...roof, pitchAngle: '0' })).grossAreaM2).toBe('80.000');
    expect((await value(roof)).grossAreaM2).toBe('92.376');
  });

  it('applies roof quantity and opening deductions to each same-size roof', async () => {
    const result = await value({
      ...roof,
      quantity: '2',
      openings: [{ type: 'other', width: '2', height: '1', quantity: '1' }],
    });
    expect(result.grossAreaM2).toBe('184.752');
    expect(result.openingAreaM2).toBe('4.000');
    expect(result.netAreaM2).toBe('180.752');
  });

  it('converts roof dimensions rather than relabelling them', async () => {
    const metric = await value(roof);
    const centimetres = await value({ ...roof, unit: 'cm', roofLength: '1000', roofWidth: '800' });
    expect(centimetres.grossAreaM2).toBe(metric.grossAreaM2);
    expect(centimetres.orderLitres).toBe(metric.orderLitres);
  });

  it('applies coats and wastage once, then rounds optional containers upward', async () => {
    const result = await value({
      ...roof,
      coats: '2',
      wastagePercent: '10',
      containerSize: '5',
      containerUnit: 'l',
    });
    expect(result.paintLitres).toBe('18.475');
    expect(result.orderLitres).toBe('20.323');
    expect(result.containers).toBe('5');
  });

  it.each([
    ['2', '92.38'],
    ['3', '92.376'],
    ['4', '92.3760'],
  ])(
    'formats roof results to %s decimal places without changing the calculation',
    async (places, expected) => {
      const result = await value({ ...roof, decimalPlaces: places });
      expect(result.grossAreaM2).toBe(expected);
      expect(result.working[0]?.result).toBe((await value(roof)).working[0]?.result);
    },
  );

  it('uses the chosen precision for wastage input validation', async () => {
    await expect(
      value({ ...roof, decimalPlaces: '3', wastagePercent: '1.250' }),
    ).resolves.toBeDefined();
    await expect(
      value({ ...roof, decimalPlaces: '4', wastagePercent: '1.2500' }),
    ).resolves.toBeDefined();
    const result = await executeOperation(
      paintQuantityV2,
      { ...roof, decimalPlaces: '2', wastagePercent: '1.250' },
      {},
      createTestContext(),
    );
    expect(result).toMatchObject({ ok: false, error: { code: 'CIVIL_TOO_MANY_DECIMALS' } });
  });

  it.each(['-1', '90'])(
    'rejects an unsafe roof pitch of %s° without clamping',
    async (pitchAngle) => {
      const result = await executeOperation(
        paintQuantityV2,
        { ...roof, pitchAngle },
        {},
        createTestContext(),
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: 'CIVIL_PAINT_PITCH_OUT_OF_RANGE', path: 'pitchAngle' },
      });
    },
  );

  it('converts coverage units exactly (m²/L and ft²/US gal give the same litres)', async () => {
    // 10 m²/L = 10 × 3.785411784 / 0.09290304 ft²/US gal = 407.45833…
    const metric = await value(room);
    const imperial = await value({ ...room, coverage: '407.458333', coverageUnit: 'ft2-per-gal' });
    expect(imperial.paintLitres).toBe(metric.paintLitres);
  });

  it('a higher coverage rate lowers the paint needed', async () => {
    const low = await value({ ...room, coverage: '8' });
    const high = await value({ ...room, coverage: '12' });
    expect(Number(high.paintLitres)).toBeLessThan(Number(low.paintLitres));
  });

  it('omits containers unless a size is supplied, then rounds them up (8.316 L / 4 L = 3)', async () => {
    expect((await value(room)).containers).toBeUndefined();
    expect((await value({ ...room, containerSize: '4', containerUnit: 'l' })).containers).toBe('3');
  });

  it('has a message for every code it can return', () => {
    for (const code of paintQuantityV2.errors) expect(messages[code]).toBeDefined();
    expect(messages.CIVIL_ASSUMPTION_COVERAGE).toBeDefined();
  });
});
