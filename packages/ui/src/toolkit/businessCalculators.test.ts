import { describe, expect, it } from 'vitest';
import { calculateAmazonFees } from './useAmazonFeeEstimator.ts';
import {
  calculateBogoDeals,
  calculateFakeMrp,
  calculateMarkup,
  calculateStackedDiscount,
} from './useMarkupCalculator.ts';
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

  describe('Markup Calculator Engine', () => {
    it('matches sample from 04-markup: Cost=500, Markup=40% -> Recommended Price=700, Margin=28.57%', () => {
      // Cost: 500, Markup: 40%
      // Markup added = 500 * 0.40 = 200
      // Selling price = 500 + 200 = 700
      // Gross margin = (200 / 700) * 100 = 28.57%
      // Quantity 20 units -> Profit = 200 * 20 = 4000
      const calc = calculateMarkup({
        mode: 'find_price',
        costPrice: 500,
        markupPercent: 40,
        givenSellingPrice: 700,
        targetMarginPercent: 30,
        quantity: 20,
        additionalCost: 0,
      });

      expect(calc.baseCost).toBe(500);
      expect(calc.markupAdded).toBe(200);
      expect(calc.sellingPrice).toBe(700);
      expect(calc.grossMargin).toBe(28.57);
      expect(calc.profitPerUnit).toBe(200);
      expect(calc.profitOnQuantity).toBe(4000);
    });

    it('calculates stacked successive discounts correctly: 50% + 20% + 10% on 2000 MRP -> 64% real discount, final 720', () => {
      const stacked = calculateStackedDiscount(2000, 50, 20, 10, 400);
      expect(stacked.nominalSumDiscount).toBe(80);
      expect(stacked.realEffectiveDiscount).toBe(64);
      expect(stacked.marketingHypeGap).toBe(16);
      expect(stacked.finalCustomerPrice).toBe(720);
      expect(stacked.totalRealSavings).toBe(1280);
      expect(stacked.sellerProfit).toBe(320);
    });

    it('calculates Buy 2 Get 1 Free (BOGO) correctly -> 33.3% real discount', () => {
      const bogo = calculateBogoDeals(2, 1, 600);
      expect(bogo.totalItemsReceived).toBe(3);
      expect(bogo.totalCustomerPays).toBe(1200);
      expect(bogo.effectivePricePerItem).toBe(400);
      expect(bogo.bogoEffectiveDiscount).toBe(33.3);
      expect(bogo.totalCustomerSaved).toBe(600);
    });

    it('calculates artificial fake MRP correctly: 80% banner discount for 500 selling price -> 2500 fake MRP', () => {
      const fake = calculateFakeMrp(500, 80);
      expect(fake.inflatedFakeMrp).toBe(2500);
      expect(fake.artificialMultiplier).toBe(5);
    });
  });
});
