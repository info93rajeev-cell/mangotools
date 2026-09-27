import { createTestContext, executeOperation } from '@mangotools/core';
import { mul, toFixedString } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { brickworkQuantity } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(brickworkQuantity, input, params, createTestContext());

const wall = {
  unit: 'm',
  wallLength: '5',
  wallHeight: '3',
  wallThickness: '0.23',
  quantity: '1',
  brickUnit: 'mm',
  brickLength: '230',
  brickWidth: '110',
  brickHeight: '75',
  mortarJointMm: '10',
  openingArea: '0',
  wastagePercent: '0',
};

describe('civil.brickwork.quantity', () => {
  it('never uses floating point (5 x 3 m wall, 0.23 m thick, is exactly 3.45 m3)', async () => {
    const result = await run(wall, { decimals: 6 });
    expect(result.ok && result.value.brickworkVolumeM3).toBe('3.450000');
    expect(result.ok && result.value.working[4]?.result).toBe('3.45');
  });

  it('computes effective brick volume with the mortar joint added to all three dimensions', async () => {
    const result = await run(wall, { decimals: 6 });
    if (!result.ok) throw new Error('expected success');
    const expected = mul(mul('0.24', '0.12'), '0.085');
    expect(result.value.effectiveBrickVolumeM3).toBe('0.002448');
    expect(expected).toBe('0.002448');
  });

  it('divides brickwork volume by effective brick volume for the estimated count', async () => {
    const result = await run(wall, { decimals: 3 });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.estimatedBrickCount).toBe('1409.314');
    expect(result.value.wastageBricks).toBe('0.000');
    expect(result.value.totalBricks).toBe('1409.314');
  });

  it('deducts the opening area once per wall, before the wall count multiplies it', async () => {
    const result = await run({
      ...wall,
      wallLength: '6',
      quantity: '2',
      openingArea: '2',
      wastagePercent: '5',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.grossWallAreaM2).toBe('36.000');
    expect(result.value.openingDeductionAreaM2).toBe('4.000');
    expect(result.value.netWallAreaM2).toBe('32.000');
    expect(result.value.brickworkVolumeM3).toBe('7.360');
    expect(result.value.estimatedBrickCount).toBe('3006.536');
    expect(result.value.wastageBricks).toBe('150.327');
    expect(result.value.totalBricks).toBe('3156.863');
  });

  it("rejects an opening area larger than one wall's own gross area", async () => {
    const result = await run({ ...wall, wallLength: '2', wallHeight: '2', openingArea: '5' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_OPENING_EXCEEDS_WALL_AREA');
  });

  it('allows a zero mortar joint (brick-volume-only count)', async () => {
    const result = await run({ ...wall, mortarJointMm: '0' }, { decimals: 6 });
    if (!result.ok) throw new Error('expected success');
    const rawVolume = mul(mul('0.23', '0.11'), '0.075');
    expect(result.value.effectiveBrickVolumeM3).toBe(toFixedString(rawVolume, 6));
  });

  it('rejects a negative mortar joint', async () => {
    const result = await run({ ...wall, mortarJointMm: '-1' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_NOT_NEGATIVE');
  });

  it('flags an implausibly large wall dimension without rejecting the input', async () => {
    const result = await run({ ...wall, wallLength: '150' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings.map((w) => w.code)).toContain(
      'CIVIL_DIMENSION_UNREALISTIC',
    );
  });

  it('always carries the standing estimation-aid warnings', async () => {
    const result = await run(wall);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'CIVIL_ESTIMATION_AID_ONLY',
      'CIVIL_VERIFY_BRICKWORK_BEFORE_CONSTRUCTION',
      'CIVIL_BRICKWORK_CONDITIONS_VARY',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON',
      'CIVIL_BRICKWORK_SCOPE_LIMIT',
    ]);
  });

  it('rejects wastage above 50%', async () => {
    const result = await run({ ...wall, wastagePercent: '50.01' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
  });

  it('rejects zero and negative dimensions', async () => {
    const zeroLength = await run({ ...wall, wallLength: '0' });
    expect(!zeroLength.ok && zeroLength.error.code).toBe('CIVIL_NOT_POSITIVE');
    const negativeThickness = await run({ ...wall, wallThickness: '-0.23' });
    expect(!negativeThickness.ok && negativeThickness.error.code).toBe('CIVIL_NOT_POSITIVE');
  });

  it('rejects an invalid wall count', async () => {
    const notWhole = await run({ ...wall, quantity: '2.5' });
    expect(!notWhole.ok && notWhole.error.code).toBe('CIVIL_QUANTITY_NOT_WHOLE');
    const zero = await run({ ...wall, quantity: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_QUANTITY_NOT_POSITIVE');
  });

  it('rejects an unknown unit through the input schema', async () => {
    const result = await run({ ...wall, unit: 'yard' });
    expect(result.ok).toBe(false);
  });

  it('has an English message for every code it can return', () => {
    const codes = [...brickworkQuantity.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
