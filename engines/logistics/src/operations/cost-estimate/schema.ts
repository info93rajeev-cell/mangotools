import { z } from 'zod';
import { freightCurrencies, rateBases } from '../../lib/freight-cost.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const costEstimateInput = z.strictObject({
  rateBasis: z.enum(rateBases),
  /** Units of the rate basis: m³ for per-cbm, a whole number of containers for per-container. */
  quantity: decimal.optional(),
  rate: decimal.optional(),
  minimumCharge: decimal.optional(),
  otherCharges: decimal.optional(),
  currency: z.enum(freightCurrencies),
});

export const costEstimateParams = z.strictObject({
  decimals: z.int().min(0).max(4).default(2),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const costEstimateOutput = z.strictObject({
  rateBasis: z.enum(rateBases),
  currency: z.enum(freightCurrencies),
  quantity: z.string(),
  rate: z.string(),
  baseCharge: z.string(),
  minimumCharge: z.string().nullable(),
  minimumApplied: z.boolean(),
  freightCharge: z.string(),
  otherCharges: z.string(),
  estimatedTotal: z.string(),
  working: z.array(workingStep),
});

export type CostEstimateInput = z.infer<typeof costEstimateInput>;
