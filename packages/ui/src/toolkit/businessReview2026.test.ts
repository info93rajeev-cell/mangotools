import { describe, expect, it } from 'vitest';
import { calculateAmazonFees } from './useAmazonFeeEstimator.ts';
import { calculateSellerProfitability } from './useSellerProfitability.ts';

describe('Seller profitability — GST inside the price is not profit (review Nov 2026)', () => {
  const base = { sellingPrice: 1000, productCost: 400, commissionPercent: 10, gstRate: 18 };

  it('subtracts the GST contained in a GST-inclusive price', () => {
    const c = calculateSellerProfitability({ ...base, isGstInclusive: true });
    // 1000 / 1.18 = 847.46 revenue; expenses 400 + 100 commission = 500; profit 347.46.
    expect(c.outputGst).toBe(152.54);
    expect(c.netBaseRevenue).toBe(847.46);
    expect(c.netProfit).toBe(347.46);
  });

  it('a GST-exclusive price is all revenue', () => {
    const c = calculateSellerProfitability({ ...base, isGstInclusive: false });
    expect(c.netProfit).toBe(500);
  });

  it('break-even price really gives zero profit (commission, fee GST and GST included)', () => {
    const params = {
      ...base,
      isGstInclusive: true,
      closingFee: 25,
      marketplaceFeeGstRate: 18,
      shippingCost: 70,
    };
    const be = calculateSellerProfitability(params).breakEvenPrice;
    const atBe = calculateSellerProfitability({ ...params, sellingPrice: be });
    expect(Math.abs(atBe.netProfit)).toBeLessThan(0.02);
  });

  it('withholds 0.6% TCS/TDS from the payout, not 2%', () => {
    const c = calculateSellerProfitability({ sellingPrice: 1000, isGstInclusive: false });
    expect(c.cashSettlementPayout).toBe(994);
  });
});

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
