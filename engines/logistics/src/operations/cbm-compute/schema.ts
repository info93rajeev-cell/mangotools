import { z } from 'zod';
import { lengthUnits } from './units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const cbmInput = z.strictObject({
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
});

export const cbmParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const cbmOutput = z.strictObject({
  cbmPerCarton: z.string(),
  totalCbm: z.string(),
  cftPerCarton: z.string(),
  totalCft: z.string(),
  quantity: z.string(),
  working: z.array(workingStep),
});

export type CbmInput = z.infer<typeof cbmInput>;
export type CbmParams = z.infer<typeof cbmParams>;
export type CbmOutput = z.infer<typeof cbmOutput>;
