import { z } from 'zod';

/**
 * A selling-price plan for one product: total cost (product + additional), the selling price from a
 * markup, a given price or a target margin, profit per unit and on a quantity, the price with GST
 * added on top, and the price any target margin needs.
 */
export const pricePlanInput = z.strictObject({
  mode: z.enum(['from-markup', 'from-price', 'from-margin']).default('from-markup'),
  productCost: z.string().optional(),
  additionalCost: z.string().default('0'),
  markupPercent: z.string().optional(),
  sellingPrice: z.string().optional(),
  targetMarginPercent: z.string().optional(),
  quantity: z.string().default('1'),
  gstRatePercent: z.string().default('0'),
});

export const pricePlanParams = z.strictObject({
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const pricePlanOutput = z.strictObject({
  totalCost: z.string(),
  sellingPrice: z.string(),
  profitPerUnit: z.string(),
  markupPercent: z.string().nullable(),
  marginPercent: z.string().nullable(),
  profitOnQuantity: z.string(),
  gstAmount: z.string(),
  priceWithGst: z.string(),
  priceForTargetMargin: z.string().nullable(),
  costSharePercent: z.string().nullable(),
  profitSharePercent: z.string().nullable(),
  working: z.array(workingStep),
});

export type PricePlanInput = z.infer<typeof pricePlanInput>;
export type PricePlanOutput = z.infer<typeof pricePlanOutput>;
