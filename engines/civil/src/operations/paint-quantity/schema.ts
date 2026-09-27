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

export const paintQuantityInput = z.strictObject({
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  secondDimension: decimal.optional(),
  openingArea: decimal.optional(),
  coats: decimal.optional(),
  coveragePerLitre: decimal.optional(),
  wastagePercent: decimal.optional(),
  quantity: decimal.optional(),
});

export const paintQuantityParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(2),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const paintQuantityOutput = z.strictObject({
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  coats: z.string(),
  coveragePerLitre: z.string(),
  wastagePercent: z.string(),
  grossArea: z.string(),
  openingDeductionArea: z.string(),
  netArea: z.string(),
  coatedArea: z.string(),
  paintLitresBeforeWastage: z.string(),
  totalPaintLitres: z.string(),
  working: z.array(workingStep),
});

export type PaintQuantityInput = z.infer<typeof paintQuantityInput>;
export type PaintQuantityParams = z.infer<typeof paintQuantityParams>;
export type PaintQuantityOutput = z.infer<typeof paintQuantityOutput>;
