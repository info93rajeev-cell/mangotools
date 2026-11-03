import { describe, expect, it } from 'vitest';
import { EMPTY_MARKUP_CALCULATION, ENGINE_MODE, readMarkupCalculation } from './markupResult.ts';

describe('Markup studio reads the engine result', () => {
  it('maps every studio mode to an engine mode', () => {
    expect(ENGINE_MODE).toEqual({
      find_price: 'from-markup',
      find_markup: 'from-price',
      target_margin: 'from-margin',
    });
  });

  it('turns decimal strings into display numbers and keeps a loss negative', () => {
    const c = readMarkupCalculation({
      totalCost: '500.00',
      sellingPrice: '400.00',
      profitPerUnit: '-100.00',
      markupPercent: '-20.00',
      marginPercent: '-25.00',
    });
    expect(c.profitPerUnit).toBe(-100);
    expect(c.markupPercent).toBe(-20);
    expect(c.grossMargin).toBe(-25);
  });

  it('shows an undefined markup as null and zeroes before the first result', () => {
    expect(readMarkupCalculation({ markupPercent: null }).markupPercent).toBeNull();
    expect(readMarkupCalculation(undefined)).toBe(EMPTY_MARKUP_CALCULATION);
  });
});
