import { describe, expect, it } from 'vitest';
import { add, compare, div, mul, parseDecimal, round, sub, toFixedString } from './decimal.ts';

describe('numeric decimal', () => {
  it('adds without floating-point error', () => {
    expect(add('0.1', '0.2')).toBe('0.3');
    expect(sub('1.00', '0.99')).toBe('0.01');
    expect(mul('999.99', '0.025')).toBe('24.99975');
  });

  it.each([
    ['2.344', '2.34'],
    ['2.345', '2.35'],
    ['2.355', '2.36'],
    ['-2.345', '-2.35'],
    ['0.005', '0.01'],
    ['0.004', '0'],
  ])('rounds %s half-up to 2 decimals as %s', (input, expected) => {
    expect(round(input, 2)).toBe(expected);
  });

  it('rounds half-even when asked', () => {
    expect(round('2.345', 2, 'half-even')).toBe('2.34');
    expect(round('2.355', 2, 'half-even')).toBe('2.36');
  });

  it('prints fixed decimals and never prints negative zero', () => {
    expect(toFixedString('90', 2)).toBe('90.00');
    expect(toFixedString('-0.001', 2)).toBe('0.00');
    expect(toFixedString('7.625', 2)).toBe('7.63');
  });

  it('divides at scale 20', () => {
    expect(div('1', '3')).toBe('0.33333333333333333333');
    expect(() => div('1', '0')).toThrow(RangeError);
  });

  it('compares', () => {
    expect(compare('10', '9.99')).toBe(1);
    expect(compare('1.0', '1')).toBe(0);
  });

  it.each(['1e3', '1,000', '', '.', '-', '12 3', '+5', 'abc'])('rejects %j', (text) => {
    expect(parseDecimal(text).ok).toBe(false);
  });

  it('parses and normalises', () => {
    expect(parseDecimal('1000.50')).toEqual({ ok: true, value: '1000.5', decimals: 2 });
    expect(parseDecimal('.5')).toEqual({ ok: true, value: '0.5', decimals: 1 });
    expect(parseDecimal('12.')).toEqual({ ok: true, value: '12', decimals: 0 });
    expect(parseDecimal('1.234', { maxDecimals: 2 })).toEqual({
      ok: false,
      code: 'TOO_MANY_DECIMALS',
    });
  });
});
