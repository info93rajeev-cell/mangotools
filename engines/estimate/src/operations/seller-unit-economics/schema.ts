import { z } from 'zod';

/**
 * One product's unit economics for a seller: selling price (with or without GST inside it), the
 * product and fulfilment costs, marketplace fees with their GST, returns, advertising and the
 * marketplace's withholding. Every rate and amount is input; the operation knows no marketplace,
 * fee table or tax rate.
 */
const amount = z.string().default('0');

export const sellerUnitEconomicsInput = z.strictObject({
  sellingPrice: z.string().optional(),
  priceIncludesGst: z.enum(['yes', 'no']).default('yes'),
  gstRatePercent: amount,
  productCost: z.string().optional(),
  packagingCost: amount,
  shippingCost: amount,
  warehousingCost: amount,
  labourCost: amount,
  overheadCost: amount,
  commissionPercent: amount,
  referralFee: amount,
  closingFee: amount,
  handlingFee: amount,
  feeGstRatePercent: amount,
  advertisingCost: amount,
  otherCost: amount,
  returnRatePercent: amount,
  reverseShippingCost: amount,
  damagedLossPercent: amount,
  expectedReturnCost: amount,
  withholdingPercent: amount,
  quantity: z.string().default('1'),
  targetProfit: z.string().optional(),
  targetMarginPercent: z.string().optional(),
});

export const sellerUnitEconomicsParams = z.strictObject({
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

const money = z.string();
const percent = z.string();

export const sellerUnitEconomicsOutput = z.strictObject({
  gstInPrice: money,
  netRevenue: money,
  directFulfillment: money,
  commissionAmount: money,
  marketplaceFees: money,
  marketplaceFeeGst: money,
  returnLoss: money,
  otherCosts: money,
  totalCosts: money,
  netProfit: money,
  netMarginPercent: percent,
  markupPercent: percent.nullable(),
  withholding: money,
  cashSettlement: money,
  monthlyProfit: money,
  monthlyRevenue: money,
  breakEvenPrice: money.nullable(),
  priceForTargetProfit: money.nullable(),
  priceForTargetMargin: money.nullable(),
  productSharePercent: percent,
  fulfillmentSharePercent: percent,
  feesSharePercent: percent,
  otherSharePercent: percent,
  gstSharePercent: percent,
  profitSharePercent: percent,
  working: z.array(workingStep),
});

export type SellerUnitEconomicsInput = z.infer<typeof sellerUnitEconomicsInput>;
export type SellerUnitEconomicsOutput = z.infer<typeof sellerUnitEconomicsOutput>;
