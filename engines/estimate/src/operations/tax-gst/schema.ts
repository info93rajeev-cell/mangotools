import { z } from 'zod';

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const gstInput = z.strictObject({
  amount: z.union([z.string(), z.number()]),
  rate: z.union([z.string(), z.number()]),
  mode: z.enum(['add', 'remove']),
  supply: z.enum(['intra', 'inter']),
});

export const gstParams = z.strictObject({
  rounding: z
    .strictObject({ mode: z.enum(['half-up', 'half-even']), decimals: z.literal(2) })
    .default({ mode: 'half-up', decimals: 2 }),
  splitMethod: z.literal('per-component').default('per-component'),
});

export const gstOutput = z.strictObject({
  taxableValue: z.string(),
  cgst: z.string(),
  sgst: z.string(),
  igst: z.string(),
  totalTax: z.string(),
  grossAmount: z.string(),
  effectiveRate: z.string(),
  working: z.array(workingStep),
});

export type GstInput = z.infer<typeof gstInput>;
export type GstParams = z.infer<typeof gstParams>;
export type GstOutput = z.infer<typeof gstOutput>;
export { workingStep };
