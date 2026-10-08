import { z } from 'zod';

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const sellerProfitabilityInput = z.strictObject({
  grossSellingPrice: z.string().optional(),
  productCost: z.string().optional(),
  marketplaceFees: z.string().default('0'),
  shippingLogistics: z.string().default('0'),
  sellerExpenses: z.string().default('0'),
  expectedReturnRtoCost: z.string().default('0'),
  nonRecoverableTaxCost: z.string().default('0'),
  settlementOnlyDeductions: z.string().default('0'),
});

export const sellerProfitabilityParams = z.strictObject({
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const sellerProfitabilityOutput = z.strictObject({
  economicProfit: z.string(),
  cashSettlement: z.string(),
  profitMarginPercent: z.string(),
  markupPercent: z.string().nullable(),
  totalEconomicCost: z.string(),
  totalSettlementDeductions: z.string(),
  working: z.array(workingStep),
});

export type SellerProfitabilityInput = z.infer<typeof sellerProfitabilityInput>;
export type SellerProfitabilityOutput = z.infer<typeof sellerProfitabilityOutput>;
