import { describe, expect, it } from 'vitest';
import { convertUnitText } from './units.ts';

describe('convertUnitText', () => {
  it('converts the value instead of relabelling it', () => {
    expect(convertUnitText('5', 'length', 'm', 'ft')).toBe('16.404199475066');
    expect(convertUnitText('10', 'length', 'mm', 'in')).toBe('0.393700787402');
    expect(convertUnitText('12', 'length', 'in', 'ft')).toBe('1');
    expect(convertUnitText('1', 'volume', 'yd3', 'ft3')).toBe('27');
    expect(convertUnitText('1', 'liquid', 'gal', 'l')).toBe('3.785411784');
  });

  it('round-trips without visible drift', () => {
    const there = convertUnitText('5', 'length', 'm', 'ft');
    expect(convertUnitText(there, 'length', 'ft', 'm')).toBe('5');
  });

  it('converts coverage rates between m²/L and ft²/US gal', () => {
    expect(convertUnitText('10', 'coverage', 'm2-per-l', 'ft2-per-gal')).toBe('407.458333333333');
  });

  it('preserves small values and converts direct-area units exactly', () => {
    expect(convertUnitText('0.00001', 'length', 'mm', 'm')).toBe('0.00000001');
    const squareFeet = convertUnitText('20', 'area', 'm', 'ft');
    expect(squareFeet).toBe('215.278208334194');
    expect(Number(convertUnitText(squareFeet, 'area', 'ft', 'm'))).toBeCloseTo(20, 10);
  });

  it('leaves blank, invalid or same-unit text alone', () => {
    expect(convertUnitText('', 'length', 'm', 'ft')).toBe('');
    expect(convertUnitText('abc', 'length', 'm', 'ft')).toBe('abc');
    expect(convertUnitText('5', 'length', 'm', 'm')).toBe('5');
    expect(convertUnitText('5', 'length', 'm', 'furlong')).toBe('5');
  });
});
