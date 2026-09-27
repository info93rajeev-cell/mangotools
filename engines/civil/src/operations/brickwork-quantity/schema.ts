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

export const brickworkQuantityInput = z.strictObject({
  unit: z.enum(lengthUnits),
  wallLength: decimal.optional(),
  wallHeight: decimal.optional(),
  wallThickness: decimal.optional(),
  quantity: decimal.optional(),
  brickUnit: z.enum(lengthUnits),
  brickLength: decimal.optional(),
  brickWidth: decimal.optional(),
  brickHeight: decimal.optional(),
  mortarJointMm: decimal.optional(),
  openingArea: decimal.optional(),
  wastagePercent: decimal.optional(),
});

export const brickworkQuantityParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const brickworkQuantityOutput = z.strictObject({
  unit: z.enum(lengthUnits),
  brickUnit: z.enum(lengthUnits),
  quantity: z.string(),
  wastagePercent: z.string(),
  mortarJointMm: z.string(),
  grossWallAreaM2: z.string(),
  openingDeductionAreaM2: z.string(),
  netWallAreaM2: z.string(),
  netWallAreaFt2: z.string(),
  brickworkVolumeM3: z.string(),
  brickworkVolumeFt3: z.string(),
  effectiveBrickVolumeM3: z.string(),
  estimatedBrickCount: z.string(),
  wastageBricks: z.string(),
  totalBricks: z.string(),
  working: z.array(workingStep),
});

export type BrickworkQuantityInput = z.infer<typeof brickworkQuantityInput>;
export type BrickworkQuantityParams = z.infer<typeof brickworkQuantityParams>;
export type BrickworkQuantityOutput = z.infer<typeof brickworkQuantityOutput>;
