import { describe, expect, it } from 'vitest';
import { EMPTY_SELLER_CALCULATION, readSellerCalculation } from './sellerProfitabilityResult.ts';

describe('Seller Profitability studio reads the engine result', () => {
  it('turns decimal strings into display numbers', () => {
    const c = readSellerCalculation({
      netProfit: '81.36',
      netMarginPercent: '9.60',
      markupPercent: '20.34',
      breakEvenPrice: '888.47',
      gstInPrice: '152.54',
    });
    expect(c.netProfit).toBe(81.36);
    expect(c.netMargin).toBe(9.6);
    expect(c.markupOnCost).toBe(20.34);
    expect(c.breakEvenPrice).toBe(888.47);
    expect(c.outputGst).toBe(152.54);
  });

  it('keeps an undefined markup and an unreachable break-even visible as such', () => {
    const c = readSellerCalculation({ markupPercent: null, breakEvenPrice: null });
    expect(c.markupOnCost).toBeNull();
    expect(Number.isNaN(c.breakEvenPrice)).toBe(true);
  });

  it('shows zeroes before the first result', () => {
    expect(readSellerCalculation(undefined)).toBe(EMPTY_SELLER_CALCULATION);
  });
});
