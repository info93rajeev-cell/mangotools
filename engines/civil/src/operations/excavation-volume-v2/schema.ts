import { z } from 'zod';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const excavationTypesV2 = ['general', 'trench', 'footing'] as const;
/** Units a usable truck volume can be entered in. */
export const truckUnits = ['m3', 'yd3', 'ft3'] as const;
export type TruckUnit = (typeof truckUnits)[number];

export const excavationVolumeInputV2 = z.strictObject({
  excavationType: z.enum(excavationTypesV2),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  depth: decimal.optional(),
  quantity: decimal.optional(),
  swellPercent: decimal.optional(),
  truckCapacity: decimal.optional(),
  truckCapacityUnit: z.enum(truckUnits).optional(),
});

/** No display params: each output is formatted by what it represents (see lib/present.ts). */
export const excavationVolumeParamsV2 = z.strictObject({});

export const excavationVolumeOutputV2 = z.strictObject({
  excavationType: z.enum(excavationTypesV2),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  swellPercent: z.string(),
  bankVolumeM3: z.string(),
  bankVolumeFt3: z.string(),
  bankVolumeYd3: z.string(),
  looseVolumeM3: z.string().optional(),
  looseVolumeFt3: z.string().optional(),
  looseVolumeYd3: z.string().optional(),
  truckCapacity: z.string().optional(),
  truckCapacityUnit: z.enum(truckUnits).optional(),
  truckLoads: z.string().optional(),
  working: z.array(workingStepSchema),
});

export type ExcavationVolumeInputV2 = z.infer<typeof excavationVolumeInputV2>;
