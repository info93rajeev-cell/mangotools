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

export const tileQuantityInput = z.strictObject({
  unit: z.enum(lengthUnits),
  surfaceLength: decimal.optional(),
  surfaceWidth: decimal.optional(),
  tileLength: decimal.optional(),
  tileWidth: decimal.optional(),
  quantity: decimal.optional(),
  wastagePercent: decimal.optional(),
  tilesPerBox: decimal.optional(),
});

export const tileQuantityParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const tileQuantityOutput = z.strictObject({
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  wastagePercent: z.string(),
  surfaceAreaM2: z.string(),
  surfaceAreaFt2: z.string(),
  tileAreaM2: z.string(),
  baseTileCount: z.string(),
  wastageTileCount: z.string(),
  totalTiles: z.string(),
  tilesPerBox: z.string().optional(),
  boxesRequired: z.string().optional(),
  working: z.array(workingStep),
});

export type TileQuantityInput = z.infer<typeof tileQuantityInput>;
export type TileQuantityParams = z.infer<typeof tileQuantityParams>;
export type TileQuantityOutput = z.infer<typeof tileQuantityOutput>;
