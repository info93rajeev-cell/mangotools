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
