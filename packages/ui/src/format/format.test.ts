import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDecimal,
  formatMoney,
  formatPercent,
  formatValue,
  groupIndian,
} from './numbers.ts';
import { partsToText, renderTemplate, templateNames } from './template.ts';

describe('number formatting', () => {
  it('groups digits the Indian way', () => {
    expect(groupIndian('118000')).toBe('1,18,000');
    expect(groupIndian('100000000')).toBe('10,00,00,000');
    expect(groupIndian('999')).toBe('999');
    expect(groupIndian('1000')).toBe('1,000');
  });

  it('formats INR money with Indian grouping and paise', () => {
    expect(formatMoney('118000', { currency: 'INR' })).toBe('₹1,18,000.00');
    expect(formatMoney('1180.5', { currency: 'INR' })).toBe('₹1,180.50');
    expect(formatMoney('-20.00', { currency: 'INR' })).toBe('−₹20.00');
    expect(formatMoney('-0.00', { currency: 'INR' })).toBe('₹0.00');
  });

  it('formats other money with international grouping', () => {
    expect(formatMoney('1234567.891')).toBe('1,234,567.891');
    expect(formatMoney('80')).toBe('80.00');
  });

  it('never rounds and leaves non-decimals alone', () => {
    expect(formatDecimal('0.123456789', 'international')).toBe('0.123456789');
    expect(formatDecimal('abc', 'indian')).toBe('abc');
    expect(formatDecimal('007', 'none')).toBe('7');
  });

  it('formats percentages and dispatches by format', () => {
    expect(formatPercent('33.33')).toBe('33.33%');
    expect(formatPercent('-25.00')).toBe('−25.00%');
    expect(formatValue('code', '{"a":1}')).toBe('{"a":1}');
    expect(formatValue('number', '1234.5')).toBe('1,234.5');
  });

  it('formats byte sizes', () => {
    expect(formatBytes(10)).toBe('10 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('working-step templates', () => {
  it('formats placeholders by their declared format', () => {
    const parts = renderTemplate(
      'CGST = {taxable:money} × {halfRate}% = {result:money}',
      { taxable: '1000.00', halfRate: '9', result: '90.00' },
      { currency: 'INR' },
    );
    expect(partsToText(parts)).toBe('CGST = ₹1,000.00 × 9% = ₹90.00');
    expect(parts.filter((p) => p.kind === 'value').map((p) => p.text)).toEqual([
      '₹1,000.00',
      '9',
      '₹90.00',
    ]);
  });

  it('keeps unknown placeholders and lists names', () => {
    expect(partsToText(renderTemplate('{a} + {b}', { a: '1' }))).toBe('1 + {b}');
    expect(templateNames('{a:money} × {b}')).toEqual(['a', 'b']);
  });
});
