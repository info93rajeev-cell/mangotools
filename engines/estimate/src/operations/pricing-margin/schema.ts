import { z } from 'zod';
import { workingStep } from '../tax-gst/schema.ts';

const decimal = z.union([z.string(), z.number()]);

export const marginSolveModes = [
  'from-cost-and-price',
  'price-from-cost-and-margin',
  'cost-from-price-and-margin',
  'price-from-cost-and-markup',
  'cost-from-price-and-markup',
] as const;

export const marginInput = z.strictObject({
  solve: z.enum(marginSolveModes),
  cost: decimal.optional(),
  price: decimal.optional(),
  marginPercent: decimal.optional(),
  markupPercent: decimal.optional(),
});

export const marginParams = z.strictObject({
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const marginOutput = z.strictObject({
  cost: z.string(),
  price: z.string(),
  profit: z.string(),
  marginPercent: z.string().nullable(),
  markupPercent: z.string().nullable(),
  working: z.array(workingStep),
});

export type MarginInput = z.infer<typeof marginInput>;
export type MarginOutput = z.infer<typeof marginOutput>;
