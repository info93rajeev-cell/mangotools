import { describe, expect, it } from 'vitest';
import { calculateAmazonFees } from './useAmazonFeeEstimator.ts';

describe('Business Calculators Engines', () => {
  describe('Amazon India Fee Estimator Engine', () => {
    it('matches sample from 03-amazon-india-fees: SP=1500, Product+Pack=635, Referral=120, Closing=125, Fee GST=44.10, Net Profit=475.90', () => {
      // Selling price: 1500, Cost: 635, Referral: 120, Closing: 125, GST on fees: 44.10, Ads+Returns: 100
      // Amazon fees with GST = 120 + 125 + 44.10 = 289.10
      // Costs excluding fees = 635 + 100 = 735.00
      // Total expenses = 289.10 + 735.00 = 1024.10
      // Net profit = 1500 - 1024.10 = 475.90
      // Margin = (475.90 / 1500) * 100 = 31.7%
      const calc = calculateAmazonFees({
        sellingPrice: 1500,
        productPackagingCost: 635,
        referralFee: 120,
        closingHandling: 125,
        feeGst: 44.1,
        adsReturns: 100,
        monthlyQty: 100,
      });

      expect(calc.amazonFeesWithGst).toBe(289.1);
      expect(calc.costsExcludingFees).toBe(735);
      expect(calc.totalExpenses).toBe(1024.1);
      expect(calc.netProfit).toBe(475.9);
      expect(calc.netMargin).toBe(31.7);
      expect(calc.monthlyProfit).toBe(47590);
    });
  });
});
