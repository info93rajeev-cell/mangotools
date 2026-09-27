import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { paintQuantity } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(paintQuantity, input, params, createTestContext());

const wall = {
  unit: 'm',
  length: '5',
  secondDimension: '4',
  openingArea: '0',
  coats: '2',
  coveragePerLitre: '10',
  wastagePercent: '10',
  quantity: '1',
};

describe('civil.paint.quantity', () => {
  it('computes gross area, net area, coated area and total litres for a simple meter wall', async () => {
    const result = await run(wall);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.grossArea).toBe('20.00');
    expect(result.value.openingDeductionArea).toBe('0.00');
    expect(result.value.netArea).toBe('20.00');
    expect(result.value.coatedArea).toBe('40.00');
    expect(result.value.paintLitresBeforeWastage).toBe('4.00');
    expect(result.value.totalPaintLitres).toBe('4.40');
  });

  it('deducts an opening area before computing coated area', async () => {
    const result = await run({ ...wall, openingArea: '2' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.netArea).toBe('18.00');
    expect(result.value.coatedArea).toBe('36.00');
    expect(result.value.paintLitresBeforeWastage).toBe('3.60');
    expect(result.value.totalPaintLitres).toBe('3.96');
  });

  it('treats a zero opening area as no deduction', async () => {
    const result = await run({ ...wall, openingArea: '0' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.openingDeductionArea).toBe('0.00');
    expect(result.value.netArea).toBe(result.value.grossArea);
  });

  it('multiplies coated area by the number of coats', async () => {
    const result = await run({ ...wall, coats: '3', wastagePercent: '0' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.coatedArea).toBe('60.00');
    expect(result.value.paintLitresBeforeWastage).toBe('6.00');
    expect(result.value.totalPaintLitres).toBe('6.00');
  });

  it('divides coated area by coverage per litre', async () => {
    const result = await run({ ...wall, coveragePerLitre: '8', wastagePercent: '0' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.paintLitresBeforeWastage).toBe('5.00');
    expect(result.value.totalPaintLitres).toBe('5.00');
  });

  it('applies wastage percentage on top of the pre-wastage litres', async () => {
    const result = await run({ ...wall, wastagePercent: '25' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.paintLitresBeforeWastage).toBe('4.00');
    expect(result.value.totalPaintLitres).toBe('5.00');
  });

  it('multiplies gross, net and coated area by the number of identical surfaces', async () => {
    const result = await run({ ...wall, quantity: '2', wastagePercent: '0' });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.grossArea).toBe('40.00');
    expect(result.value.netArea).toBe('40.00');
    expect(result.value.coatedArea).toBe('80.00');
    expect(result.value.totalPaintLitres).toBe('8.00');
  });

  it('computes area and litres natively in feet, without a metric conversion', async () => {
    const result = await run({
      unit: 'ft',
      length: '10',
      secondDimension: '10',
      openingArea: '0',
      coats: '1',
      coveragePerLitre: '40',
      wastagePercent: '0',
      quantity: '1',
    });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.grossArea).toBe('100.00');
    expect(result.value.totalPaintLitres).toBe('2.50');
  });

  it('gives the same result for numbers and strings', async () => {
    const fromStrings = await run(wall);
    const fromNumbers = await run({
      unit: 'm',
      length: 5,
      secondDimension: 4,
      openingArea: 0,
      coats: 2,
      coveragePerLitre: 10,
      wastagePercent: 10,
      quantity: 1,
    });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('rejects zero and negative dimensions', async () => {
    const zero = await run({ ...wall, length: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_NOT_POSITIVE');
    const negative = await run({ ...wall, secondDimension: '-4' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_NOT_POSITIVE');
  });

  it('rejects missing dimensions', async () => {
    const { length, ...missing } = wall;
    const result = await run(missing);
    expect(!result.ok && result.error.code).toBe('CIVIL_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('length');
  });

  it('rejects an invalid number', async () => {
    const result = await run({ ...wall, secondDimension: 'abc' });
    expect(!result.ok && result.error.code).toBe('CIVIL_INVALID_NUMBER');
  });

  it('rejects a negative opening area', async () => {
    const result = await run({ ...wall, openingArea: '-1' });
    expect(!result.ok && result.error.code).toBe('CIVIL_NOT_NEGATIVE');
  });

  it('rejects an opening area that equals or exceeds the gross area', async () => {
    const equal = await run({ ...wall, openingArea: '20' });
    expect(!equal.ok && equal.error.code).toBe('CIVIL_OPENING_EXCEEDS_SURFACE_AREA');
    const exceeds = await run({ ...wall, openingArea: '25' });
    expect(!exceeds.ok && exceeds.error.code).toBe('CIVIL_OPENING_EXCEEDS_SURFACE_AREA');
  });

  it('rejects coats that are not a positive whole number', async () => {
    const zero = await run({ ...wall, coats: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_COATS_NOT_POSITIVE');
    const fractional = await run({ ...wall, coats: '1.5' });
    expect(!fractional.ok && fractional.error.code).toBe('CIVIL_COATS_NOT_WHOLE');
    const negative = await run({ ...wall, coats: '-2' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_COATS_NOT_POSITIVE');
  });

  it('rejects a coverage per litre that is not positive', async () => {
    const zero = await run({ ...wall, coveragePerLitre: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_NOT_POSITIVE');
    const negative = await run({ ...wall, coveragePerLitre: '-10' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_NOT_POSITIVE');
  });

  it('rejects wastage below 0 or above 50', async () => {
    const negative = await run({ ...wall, wastagePercent: '-1' });
    expect(!negative.ok && negative.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
    const tooHigh = await run({ ...wall, wastagePercent: '50.01' });
    expect(!tooHigh.ok && tooHigh.error.code).toBe('CIVIL_WASTAGE_OUT_OF_RANGE');
  });

  it('rejects an invalid number of surfaces', async () => {
    const notWhole = await run({ ...wall, quantity: '1.5' });
    expect(!notWhole.ok && notWhole.error.code).toBe('CIVIL_QUANTITY_NOT_WHOLE');
    const zero = await run({ ...wall, quantity: '0' });
    expect(!zero.ok && zero.error.code).toBe('CIVIL_QUANTITY_NOT_POSITIVE');
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
      'CIVIL_VERIFY_PAINT_BEFORE_APPLICATION',
      'CIVIL_PAINT_CONDITIONS_VARY',
      'CIVIL_NOT_PROFESSIONAL_REPLACEMENT_PAINTER',
      'CIVIL_PAINT_SCOPE_LIMIT',
    ]);
  });

  it('respects the decimals param for area/litres output, but not for coats or coverage input', async () => {
    const result = await run(wall, { decimals: 3 });
    expect(result.ok && result.value.grossArea).toBe('20.000');
    expect(result.ok && result.value.coats).toBe('2');
    expect(result.ok && result.value.coveragePerLitre).toBe('10');
  });

  it('has an English message for every code it can return', () => {
    const codes = [...paintQuantity.errors, 'CIVIL_DIMENSION_UNREALISTIC'];
    for (const code of codes) expect(messages[code], code).toBeTruthy();
  });
});
