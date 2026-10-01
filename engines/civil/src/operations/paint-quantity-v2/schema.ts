import { z } from 'zod';
import { openingsInput } from '../../lib/openings.ts';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const paintModes = ['room', 'surface'] as const;
export const coverageUnits = ['m2-per-l', 'ft2-per-gal'] as const;
export type CoverageUnit = (typeof coverageUnits)[number];
export const containerUnits = ['l', 'gal'] as const;
export type ContainerUnit = (typeof containerUnits)[number];

export const paintQuantityInputV2 = z.strictObject({
  mode: z.enum(paintModes),
  unit: z.enum(lengthUnits),
  roomLength: decimal.optional(),
  roomWidth: decimal.optional(),
  roomHeight: decimal.optional(),
  includeCeiling: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  length: decimal.optional(),
  secondDimension: decimal.optional(),
  quantity: decimal.optional(),
  openings: openingsInput,
  coats: decimal.optional(),
  coverage: decimal.optional(),
  coverageUnit: z.enum(coverageUnits),
  wastagePercent: decimal.optional(),
  containerSize: decimal.optional(),
  containerUnit: z.enum(containerUnits).optional(),
});

/** No display params: each output is formatted by what it represents (see lib/present.ts). */
export const paintQuantityParamsV2 = z.strictObject({});

export const paintQuantityOutputV2 = z.strictObject({
  mode: z.enum(paintModes),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  coats: z.string(),
  coverage: z.string(),
  coverageUnit: z.enum(coverageUnits),
  wastagePercent: z.string(),
  grossAreaM2: z.string(),
  openingAreaM2: z.string(),
  netAreaM2: z.string(),
  grossAreaFt2: z.string(),
  openingAreaFt2: z.string(),
  netAreaFt2: z.string(),
  paintLitres: z.string(),
  paintGallons: z.string(),
  orderLitres: z.string(),
  orderGallons: z.string(),
  containerSize: z.string().optional(),
  containerUnit: z.enum(containerUnits).optional(),
  containers: z.string().optional(),
  working: z.array(workingStepSchema),
});

export type PaintQuantityInputV2 = z.infer<typeof paintQuantityInputV2>;
