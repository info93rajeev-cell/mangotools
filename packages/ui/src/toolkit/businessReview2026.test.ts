import { describe, expect, it } from 'vitest';
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
