import { z } from 'zod';
import { openingsInput } from '../../lib/openings.ts';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const tileSurfaceModes = ['dimensions', 'area'] as const;
export const packModes = ['none', 'pieces', 'coverage'] as const;
export const boxCoverageUnits = ['m2', 'ft2'] as const;
export type BoxCoverageUnit = (typeof boxCoverageUnits)[number];

export const tileQuantityInputV2 = z.strictObject({
  mode: z.enum(tileSurfaceModes),
  unit: z.enum(lengthUnits),
  surfaceLength: decimal.optional(),
  surfaceWidth: decimal.optional(),
  surfaceArea: decimal.optional(),
  quantity: decimal.optional(),
  openings: openingsInput,
  tileUnit: z.enum(lengthUnits),
  tileLength: decimal.optional(),
  tileWidth: decimal.optional(),
  wastagePercent: decimal.optional(),
  packMode: z.enum(packModes),
  tilesPerBox: decimal.optional(),
  boxCoverage: decimal.optional(),
  boxCoverageUnit: z.enum(boxCoverageUnits).optional(),
});

/** No display params: each output is formatted by what it represents (see lib/present.ts). */
export const tileQuantityParamsV2 = z.strictObject({});

export const tileQuantityOutputV2 = z.strictObject({
  unit: z.enum(lengthUnits),
  tileUnit: z.enum(lengthUnits),
  quantity: z.string(),
  wastagePercent: z.string(),
  packMode: z.enum(packModes),
  grossAreaM2: z.string(),
  openingAreaM2: z.string(),
  netAreaM2: z.string(),
  grossAreaFt2: z.string(),
  openingAreaFt2: z.string(),
  netAreaFt2: z.string(),
  baseTiles: z.string(),
  wastageTiles: z.string(),
  orderTiles: z.string(),
  boxes: z.string().optional(),
  working: z.array(workingStepSchema),
});

export type TileQuantityInputV2 = z.infer<typeof tileQuantityInputV2>;
