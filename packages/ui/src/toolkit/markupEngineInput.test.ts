import { describe, expect, it } from 'vitest';
import { markupEngineInput } from './useMarkupCalculator.ts';

const base = {
  pricingMode: 'find_price' as const,
  costPrice: 500,
  markupPercent: 40,
  givenSellingPrice: 700,
  targetMarginPercent: 30,
  quantity: 20,
  additionalCost: 0,
  gstPercent: 0,
};

describe('Markup studio → estimate.pricing.margin@1 input', () => {
  it('find selling price sends cost and markup only', () => {
    expect(markupEngineInput(base)).toEqual({
      solve: 'price-from-cost-and-markup',
      cost: '500',
      quantity: '20',
      markupPercent: '40',
    });
  });

  it('find markup sends the selling price, target margin sends the margin', () => {
    expect(markupEngineInput({ ...base, pricingMode: 'find_markup' })).toMatchObject({
      solve: 'from-cost-and-price',
      price: '700',
    });
    expect(markupEngineInput({ ...base, pricingMode: 'target_margin' })).toMatchObject({
      solve: 'price-from-cost-and-margin',
      marginPercent: '30',
    });
  });

  it('sends extra cost and GST only when set', () => {
    const input = markupEngineInput({ ...base, additionalCost: 50, gstPercent: 18 });
    expect(input).toMatchObject({ extraCost: '50', gstPercent: '18' });
    expect(markupEngineInput(base)).not.toHaveProperty('extraCost');
  });
});
