import { z } from 'zod';
import { openingsInput } from '../../lib/openings.ts';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const brickworkQuantityInputV2 = z.strictObject({
  unit: z.enum(lengthUnits),
  wallLength: decimal.optional(),
  wallHeight: decimal.optional(),
  quantity: decimal.optional(),
  wythes: decimal.optional(),
  openings: openingsInput,
  brickUnit: z.enum(lengthUnits),
  brickLength: decimal.optional(),
  brickHeight: decimal.optional(),
  mortarJoint: decimal.optional(),
  wastagePercent: decimal.optional(),
});

/** No display params: each output is formatted by what it represents (see lib/present.ts). */
export const brickworkQuantityParamsV2 = z.strictObject({});

export const brickworkQuantityOutputV2 = z.strictObject({
  unit: z.enum(lengthUnits),
  brickUnit: z.enum(lengthUnits),
  quantity: z.string(),
  wythes: z.string(),
  mortarJoint: z.string(),
  wastagePercent: z.string(),
  grossWallAreaM2: z.string(),
  openingAreaM2: z.string(),
  netWallAreaM2: z.string(),
  grossWallAreaFt2: z.string(),
  openingAreaFt2: z.string(),
  netWallAreaFt2: z.string(),
  baseBricks: z.string(),
  wastageBricks: z.string(),
  orderBricks: z.string(),
  working: z.array(workingStepSchema),
});

export type BrickworkQuantityInputV2 = z.infer<typeof brickworkQuantityInputV2>;
