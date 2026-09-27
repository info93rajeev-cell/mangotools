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

export const surfaceTypes = ['wall', 'ceiling', 'general'] as const;
export type SurfaceType = (typeof surfaceTypes)[number];

export const plasterQuantityInput = z.strictObject({
  surfaceType: z.enum(surfaceTypes),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  secondDimension: decimal.optional(),
  plasterThickness: decimal.optional(),
  quantity: decimal.optional(),
  openingArea: decimal.optional(),
  wastagePercent: decimal.optional(),
});

export const plasterQuantityParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const plasterQuantityOutput = z.strictObject({
  surfaceType: z.enum(surfaceTypes),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  plasterThickness: z.string(),
  wastagePercent: z.string(),
  grossAreaM2: z.string(),
  openingDeductionAreaM2: z.string(),
  netAreaM2: z.string(),
  netAreaFt2: z.string(),
  plasterVolumeM3: z.string(),
  wastageVolumeM3: z.string(),
  totalVolumeM3: z.string(),
  totalVolumeFt3: z.string(),
  working: z.array(workingStep),
});

export type PlasterQuantityInput = z.infer<typeof plasterQuantityInput>;
export type PlasterQuantityParams = z.infer<typeof plasterQuantityParams>;
export type PlasterQuantityOutput = z.infer<typeof plasterQuantityOutput>;
