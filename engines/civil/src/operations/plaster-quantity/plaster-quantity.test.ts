import { createTestContext, executeOperation } from '@mangotools/core';
import { mul, toFixedString } from '@mangotools/engine-numeric';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { plasterQuantity } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(plasterQuantity, input, params, createTestContext());

const wall = {
  surfaceType: 'wall',
  unit: 'm',
  length: '5',
  secondDimension: '3',
  plasterThickness: '0.012',
  quantity: '1',
  openingArea: '0',
  wastagePercent: '0',
};

describe('civil.plaster.quantity', () => {
  it('never uses floating point (5 x 3 m wall, 12 mm thick, is exactly 0.18 m3)', async () => {
    const result = await run(wall, { decimals: 6 });
    expect(result.ok && result.value.plasterVolumeM3).toBe('0.180000');
    expect(result.ok && result.value.working[5]?.result).toBe('0.18');
  });

  it('gives the same result for numbers and strings, and accepts 2.0 surfaces as 2', async () => {
    const fromStrings = await run({ ...wall, quantity: '2.0' });
    const fromNumbers = await run({
      surfaceType: 'wall',
      unit: 'm',
      length: 5,
      secondDimension: 3,
      plasterThickness: 0.012,
      quantity: 2,
      openingArea: 0,
      wastagePercent: 0,
    });
    expect(fromStrings).toEqual(fromNumbers);
    expect(fromNumbers.ok && fromNumbers.value.plasterVolumeM3).toBe('0.360');
  });

  it('deducts the opening area once per surface, before the surface count multiplies it', async () => {
    const result = await run({
      ...wall,
      surfaceType: 'ceiling',
      length: '6',
      secondDimension: '4',
      plasterThickness: '0.015',
      quantity: '2',
      openingArea: '1.5',
      wastagePercent: '10',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.grossAreaM2).toBe('48.000');
    expect(result.value.openingDeductionAreaM2).toBe('3.000');
    expect(result.value.netAreaM2).toBe('45.000');
    expect(result.value.plasterVolumeM3).toBe('0.675');
    expect(result.value.wastageVolumeM3).toBe('0.068');
    expect(result.value.totalVolumeM3).toBe('0.743');
  });

  it('rejects an opening area larger than one surface own gross area', async () => {
    const result = await run({ ...wall, length: '2', secondDimension: '2', openingArea: '5' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_OPENING_EXCEEDS_SURFACE_AREA');
  });

  it('defaults to zero wastage, so total volume equals plaster volume', async () => {
    const result = await run(wall);
    expect(result.ok && result.value.wastageVolumeM3).toBe('0.000');
    expect(result.ok && result.value.totalVolumeM3).toBe(result.ok && result.value.plasterVolumeM3);
  });

  it('rejects a negative opening area', async () => {
    const result = await run({ ...wall, openingArea: '-1' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_NOT_NEGATIVE');
  });

  it('flags an implausibly large surface dimension without rejecting the input', async () => {
    const result = await run({ ...wall, length: '150' });
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
      'CIVIL_VERIFY_PLASTER_BEFORE_CONSTRUCTION',
      'CIVIL_PLASTER_CONDITIONS_VARY',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON',
      'CIVIL_PLASTER_SCOPE_LIMIT',
    ]);
  });

  it('rejects wastage above 50%', async () => {
    const result = await run({ ...wall, wastagePercent: '50.01' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
  });

  it('rejects zero and negative dimensions', async () => {
    const zeroLength = await run({ ...wall, length: '0' });
    expect(!zeroLength.ok && zeroLength.error.code).toBe('CIVIL_NOT_POSITIVE');
    const negativeThickness = await run({ ...wall, plasterThickness: '-0.012' });
    expect(!negativeThickness.ok && negativeThickness.error.code).toBe('CIVIL_NOT_POSITIVE');
  });

  it('rejects an invalid surface count', async () => {
    const notWhole = await run({ ...wall, quantity: '2.5' });
    expect(!notWhole.ok && notWhole.error.code).toBe('CIVIL_QUANTITY_NOT_WHOLE');
    const zero = await run({ ...wall, quantity: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_QUANTITY_NOT_POSITIVE');
  });

  it('rejects an unknown unit or surface type through the input schema', async () => {
    const badUnit = await run({ ...wall, unit: 'yard' });
    expect(badUnit.ok).toBe(false);
    const badType = await run({ ...wall, surfaceType: 'floor' });
    expect(badType.ok).toBe(false);
  });

  it('computes ft2/ft3 conversions from the exact metric value', async () => {
    const result = await run(wall, { decimals: 6 });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.netAreaFt2).toBe(toFixedString(mul('15', '10.7639104'), 6));
    expect(result.value.totalVolumeFt3).toBe(toFixedString(mul('0.18', '35.3146667'), 6));
  });

  it('has an English message for every code it can return', () => {
    const codes = [...plasterQuantity.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
