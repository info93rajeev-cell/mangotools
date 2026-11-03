import { describe, expect, it } from 'vitest';
import { calculateSellerProfitability } from './useSellerProfitability.ts';

describe('Business Calculators Engines', () => {
  describe('Seller Profitability Engine', () => {
    it('matches sample from 02-seller-profitability: SP=1000, Cost=400, Commission=10%, Net Profit=330', () => {
      // Selling price: 1000, Product cost: 400, Pack: 30, Ship: 70 (Pack+Ship=100), Commission: 10% (100), Ads: 50, Other: 20 (Ads+Other=70)
      // Total expenses: 400 + 100 + 100 + 70 = 670
      // Net profit = 1000 - 670 = 330
      // Net margin = (330 / 1000) * 100 = 33.0%
      // Markup on cost = (330 / 400) * 100 = 82.5%
      const calc = calculateSellerProfitability({
        sellingPrice: 1000,
        productCost: 400,
        packagingCost: 30,
        shippingCost: 70,
        monthlyQty: 100,
        commissionPercent: 10,
        adCost: 50,
        otherCharges: 20,
        // The reference sample's ₹1,000 is the GST-exclusive price (no GST inside it).
        isGstInclusive: false,
      });

      expect(calc.totalExpenses).toBe(670);
      expect(calc.netProfit).toBe(330);
      expect(calc.netMargin).toBe(33);
      expect(calc.markupOnCost).toBe(82.5);
      expect(calc.monthlyProfit).toBe(33000);
      expect(calc.costPct).toBe(40);
      expect(calc.fulfillmentPct).toBe(10);
      expect(calc.feesPct).toBe(17);
      expect(calc.profitPct).toBe(33);
      expect(calc.breakEvenPrice).toBe(633.33);
    });
  });
});
