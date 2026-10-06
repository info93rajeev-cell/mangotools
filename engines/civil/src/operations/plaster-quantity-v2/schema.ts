import { z } from 'zod';
import { openingsInput } from '../../lib/openings.ts';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const surfaceTypesV2 = ['wall', 'ceiling', 'general'] as const;
export const thicknessUnits = ['mm', 'in'] as const;
export type ThicknessUnit = (typeof thicknessUnits)[number];
/** How (if at all) bags are estimated: never from an assumed universal density. */
export const materialModes = ['none', 'bag-yield', 'bag-coverage'] as const;
export const bagYieldUnits = ['l', 'ft3'] as const;
export type BagYieldUnit = (typeof bagYieldUnits)[number];
export const bagCoverageUnits = ['m2', 'ft2'] as const;
export type BagCoverageUnit = (typeof bagCoverageUnits)[number];

export const plasterQuantityInputV2 = z.strictObject({
  surfaceType: z.enum(surfaceTypesV2),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  secondDimension: decimal.optional(),
  quantity: decimal.optional(),
  openings: openingsInput,
  thickness: decimal.optional(),
  thicknessUnit: z.enum(thicknessUnits),
  wastagePercent: decimal.optional(),
  materialMode: z.enum(materialModes),
  bagYield: decimal.optional(),
  bagYieldUnit: z.enum(bagYieldUnits).optional(),
  bagCoverage: decimal.optional(),
  bagCoverageUnit: z.enum(bagCoverageUnits).optional(),
  bagCoverageThickness: decimal.optional(),
  decimalPlaces: z.enum(['2', '3', '4']).optional(),
});

/** No display params: each output is formatted by what it represents (see lib/present.ts). */
export const plasterQuantityParamsV2 = z.strictObject({});

export const plasterQuantityOutputV2 = z.strictObject({
  surfaceType: z.enum(surfaceTypesV2),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  thickness: z.string(),
  thicknessUnit: z.enum(thicknessUnits),
  wastagePercent: z.string(),
  materialMode: z.enum(materialModes),
  grossAreaM2: z.string(),
  openingAreaM2: z.string(),
  netAreaM2: z.string(),
  grossAreaFt2: z.string(),
  openingAreaFt2: z.string(),
  netAreaFt2: z.string(),
  wetVolumeM3: z.string(),
  wetVolumeFt3: z.string(),
  wetVolumeLitres: z.string(),
  orderVolumeM3: z.string(),
  orderVolumeFt3: z.string(),
  orderVolumeLitres: z.string(),
  bags: z.string().optional(),
  working: z.array(workingStepSchema),
});

export type PlasterQuantityInputV2 = z.infer<typeof plasterQuantityInputV2>;
