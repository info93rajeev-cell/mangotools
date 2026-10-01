import { describe, expect, it } from 'vitest';
import { convertUnitText } from './units.ts';

describe('convertUnitText', () => {
  it('converts the value instead of relabelling it', () => {
    expect(convertUnitText('5', 'length', 'm', 'ft')).toBe('16.404199');
    expect(convertUnitText('10', 'length', 'mm', 'in')).toBe('0.393701');
    expect(convertUnitText('12', 'length', 'in', 'ft')).toBe('1');
    expect(convertUnitText('1', 'volume', 'yd3', 'ft3')).toBe('27');
    expect(convertUnitText('1', 'liquid', 'gal', 'l')).toBe('3.785412');
  });

  it('round-trips without visible drift', () => {
    const there = convertUnitText('5', 'length', 'm', 'ft');
    expect(convertUnitText(there, 'length', 'ft', 'm')).toBe('5');
  });

  it('converts coverage rates between m²/L and ft²/US gal', () => {
    expect(convertUnitText('10', 'coverage', 'm2-per-l', 'ft2-per-gal')).toBe('407.458333');
  });

  it('leaves blank, invalid or same-unit text alone', () => {
    expect(convertUnitText('', 'length', 'm', 'ft')).toBe('');
    expect(convertUnitText('abc', 'length', 'm', 'ft')).toBe('abc');
    expect(convertUnitText('5', 'length', 'm', 'm')).toBe('5');
    expect(convertUnitText('5', 'length', 'm', 'furlong')).toBe('5');
  });
});
