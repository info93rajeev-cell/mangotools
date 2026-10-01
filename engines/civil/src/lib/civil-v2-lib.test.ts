import { describe, expect, it } from 'vitest';
import { checkDeductions, openingsArea, readOpenings } from './openings.ts';
import { amount, area, calculated, ceilWhole, volume } from './present.ts';
import { ratioWithAllowance, toFt2, toFt3, toYd3, withAllowance } from './quantities.ts';
import { readPositive } from './read-input.ts';
import { MEASURE_DECIMALS } from './units-v2.ts';

describe('measurement input', () => {
  it('preserves small values and converted values through 12 decimal places', () => {
    expect(readPositive('0.00000001', 'length', MEASURE_DECIMALS)).toMatchObject({
      ok: true,
      value: '0.00000001',
    });
    expect(readPositive('16.404199475066', 'length', MEASURE_DECIMALS)).toMatchObject({
      ok: true,
      value: '16.404199475066',
    });
    expect(readPositive('1.0000000000001', 'length', MEASURE_DECIMALS)).toMatchObject({
      ok: false,
      error: { code: 'CIVIL_TOO_MANY_DECIMALS' },
    });
  });
});

describe('present', () => {
  it('rounds discrete purchase quantities up to whole units', () => {
    expect(ceilWhole('68878.754371')).toBe('68879');
    expect(ceilWhole('713.999999')).toBe('714');
    expect(ceilWhole('714')).toBe('714');
    expect(ceilWhole('714.000')).toBe('714');
    expect(ceilWhole('0.0000001')).toBe('1');
    expect(ceilWhole('0')).toBe('0');
  });

  it('formats each kind of result with its own practical precision', () => {
    expect(area('15.123456')).toBe('15.12');
    expect(volume('3.0004999')).toBe('3.000');
    expect(amount('3.955')).toBe('3.96');
    expect(calculated('68878.754371')).toBe('68878.75');
  });
});

describe('quantities', () => {
  it('uses exact imperial conversions', () => {
    expect(area(toFt2('0.09290304'))).toBe('1.00');
    expect(amount(toFt3('0.028316846592'))).toBe('1.00');
    expect(amount(toYd3('0.764554857984'))).toBe('1.00');
  });

  it('keeps exact whole results whole after an allowance', () => {
    expect(ratioWithAllowance('48', '0.02', '10')).toBe('2640');
    expect(ceilWhole(ratioWithAllowance('1000', '3', '5'))).toBe('350');
    expect(withAllowance('3.6', '10')).toBe('3.96');
  });
});

describe('openings', () => {
  it('sums width × height × quantity and treats a missing quantity as 1', () => {
    const rows = readOpenings([
      { width: '0.9', height: '2.1' },
      { width: '1.2', height: '1.2', quantity: '2' },
    ]);
    expect(rows.ok && openingsArea(rows.value)).toBe('4.77');
  });

  it('ignores fully blank rows and reads JSON text', () => {
    const rows = readOpenings('[{},{"width":"1","height":"2","quantity":"3"}]');
    expect(rows.ok && openingsArea(rows.value)).toBe('6');
    expect(readOpenings('').ok).toBe(true);
  });

  it('rejects unreadable, partial and excessive rows', () => {
    const bad = readOpenings('not json');
    expect(!bad.ok && bad.error.code).toBe('CIVIL_OPENINGS_INVALID');
    const partial = readOpenings([{ width: '1' }]);
    expect(!partial.ok && partial.error.path).toBe('openings[0].height');
    const many = readOpenings(Array.from({ length: 21 }, () => ({ width: '1', height: '1' })));
    expect(!many.ok && many.error.code).toBe('CIVIL_OPENINGS_TOO_MANY');
  });

  it('rejects deductions that leave zero or negative net area', () => {
    expect(checkDeductions('15', '15').ok).toBe(false);
    expect(checkDeductions('15', '16').ok).toBe(false);
    expect(checkDeductions('15', '14.99').ok).toBe(true);
  });
});
