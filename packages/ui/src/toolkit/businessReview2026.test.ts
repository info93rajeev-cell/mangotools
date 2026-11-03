import { describe, expect, it } from 'vitest';
import { calculateAmazonFees } from './useAmazonFeeEstimator.ts';

describe('Amazon fee estimator (review Nov 2026)', () => {
  it('withholds 0.6% TCS/TDS from the bank payout', () => {
    const c = calculateAmazonFees({
      sellingPrice: 1000,
      referralFee: 0,
      closingHandling: 0,
      feeGst: 0,
    });
    expect(c.bankPayout).toBe(994);
  });
});

describe('Amazon fee estimator — GST inside the price', () => {
  it('takes 18% GST out of a ₹1,500 price before profit', () => {
    const c = calculateAmazonFees({
      sellingPrice: 1500,
      productGstRate: 18,
      productPackagingCost: 635,
      referralFee: 120,
      closingHandling: 125,
      feeGst: 44.1,
      adsReturns: 100,
    });
    // 1500 / 1.18 = 1271.19; − 635 − 289.10 − 100 = 247.09
    expect(c.productGst).toBe(228.81);
    expect(c.netProfit).toBe(247.09);
  });
});
