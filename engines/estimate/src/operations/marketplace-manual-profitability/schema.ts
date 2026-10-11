import { z } from 'zod';

/**
 * Input shapes are deliberately permissive about mode-dependent and required values: the operation
 * reports those as typed ESTIMATE_ errors (TASK-008L) instead of a generic schema failure.
 */

export const scenarioIds = ['successful-sale', 'customer-return', 'rto', 'cancellation'] as const;
const scenario = z.enum(scenarioIds);
const scenarioList = z.array(scenario).default(['successful-sale']);
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const weightUnit = z.enum(['g', 'kg']);

const priceSlab = z.strictObject({
  min: z.string().optional(),
  max: z.string().optional(),
  chargeMode: z.enum(['fixed', 'percent']),
  value: z.string().optional(),
});

const weightSlab = z.strictObject({
  min: z.string().optional(),
  max: z.string().optional(),
  unit: weightUnit,
  amount: z.string().optional(),
});

export const percentageBases = [
  'realized-customer-value',
  'tax-exclusive-revenue',
  'customer-invoice-value',
] as const;

const feeLine = z.strictObject({
  id,
  enabled: z.boolean(),
  mode: z.enum(['fixed', 'percent', 'price-slabs', 'weight-slabs']),
  amount: z.string().optional(),
  ratePercent: z.string().optional(),
  quantityScope: z.enum(['per-unit', 'per-order']).optional(),
  percentageBase: z.enum(percentageBases).optional(),
  slabPriceBase: z.enum(['entered-unit-selling-price', 'realized-unit-selling-price']).optional(),
  priceSlabs: z.array(priceSlab).optional(),
  weightSlabs: z.array(weightSlab).optional(),
  gstTreatment: z.enum(['none', 'recoverable', 'non-recoverable']).optional(),
  scenarios: scenarioList,
});

const scopedAmount = z.strictObject({ amount: z.string(), scenarios: scenarioList });

const withholding = z.strictObject({
  mode: z.enum(['percent', 'fixed']),
  value: z.string(),
  percentageBase: z.enum(['tax-exclusive-revenue', 'customer-invoice-value']).optional(),
  scenarios: scenarioList,
});

const adjustment = z.strictObject({
  id,
  direction: z.enum(['charge', 'credit']),
  amount: z.string(),
  economic: z.boolean(),
  settlement: z.boolean(),
  scenarios: z.array(scenario).optional(),
});

export const manualProfitabilityInput = z.strictObject({
  sellingPricePerUnit: z.string().optional(),
  quantity: z.string().optional(),
  productCostPerUnit: z.string().optional(),
  promotionalDiscount: z.string().default('0'),
  couponDiscount: z.string().default('0'),
  productGstRatePercent: z.string().default('0'),
  sellingPriceTaxMode: z.enum(['gst-inclusive', 'gst-exclusive']).default('gst-inclusive'),
  chargeableWeight: z.strictObject({ value: z.string(), unit: weightUnit }).optional(),
  feeLines: z.array(feeLine).default([]),
  marketplaceFeeGstRatePercent: z.string().optional(),
  packagingCost: scopedAmount.optional(),
  sellerShippingCost: scopedAmount.optional(),
  advertisingCost: scopedAmount.optional(),
  otherTransactionCost: scopedAmount.optional(),
  tcs: withholding.optional(),
  tds: withholding.optional(),
  otherSettlementDeductions: scopedAmount.optional(),
  settlementCredits: scopedAmount.optional(),
  scenario: scenario.default('successful-sale'),
  scenarioAdjustments: z.array(adjustment).default([]),
});

export const manualProfitabilityParams = z.strictObject({
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

const feeResult = z.strictObject({
  id: z.string(),
  mode: z.enum(['fixed', 'percent', 'price-slabs', 'weight-slabs']),
  applicable: z.boolean(),
  percentageBase: z.enum(percentageBases).nullable(),
  base: z.string().nullable(),
  slabPriceBase: z.enum(['entered-unit-selling-price', 'realized-unit-selling-price']).nullable(),
  slabMatchValue: z.string().nullable(),
  matchedSlabIndex: z.int().nullable(),
  amount: z.string(),
  gstAmount: z.string(),
  gstTreatment: z.enum(['none', 'recoverable', 'non-recoverable']),
});

const money = z.string();

export const manualProfitabilityOutput = z.strictObject({
  scenario,
  grossCustomerValue: money,
  sellerFundedReduction: money,
  realizedCustomerValue: money,
  customerInvoiceValue: money,
  orderProductGstAmount: money,
  taxExclusiveRevenue: money,
  productCostTotal: money,
  revenueRecognised: money,
  invoiceValueSettled: money,
  productCostRecognised: money,
  productGstLiabilityRecognised: money,
  marketplaceFees: z.array(feeResult),
  marketplaceFeesTotal: money,
  marketplaceFeeGstTotal: money,
  recoverableMarketplaceFeeGst: money,
  nonRecoverableMarketplaceFeeGst: money,
  sellerControlledCostsTotal: money,
  scenarioEconomicCosts: money,
  scenarioEconomicCredits: money,
  scenarioSettlementDeductions: money,
  scenarioSettlementCredits: money,
  tcsAmount: money,
  tdsAmount: money,
  otherSettlementDeductionsApplied: money,
  settlementCreditsApplied: money,
  totalSettlementDeductions: money,
  estimatedSettlement: money,
  totalEconomicInvestment: money,
  economicProfit: money,
  profitMarginPercent: money.nullable(),
  roiPercent: money.nullable(),
  effectiveMarketplaceFeePercent: money.nullable(),
  breakEvenSellingPrice: money.nullable(),
  working: z.array(workingStep),
});

export type ManualProfitabilityInput = z.infer<typeof manualProfitabilityInput>;
export type ManualProfitabilityOutput = z.infer<typeof manualProfitabilityOutput>;
export type FeeLineInput = ManualProfitabilityInput['feeLines'][number];
export type FeeResult = z.infer<typeof feeResult>;
export type Scenario = (typeof scenarioIds)[number];
export type PercentageBase = (typeof percentageBases)[number];
