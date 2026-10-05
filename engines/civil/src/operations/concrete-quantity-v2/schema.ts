import { z } from 'zod';
import { lengthUnits } from '../../lib/units-v2.ts';
import { workingStepSchema } from '../../lib/working.ts';

const decimal = z.union([z.string(), z.number()]);

export const memberTypesV2 = [
  'slab',
  'footing',
  'wall',
  'beam',
  'column',
  'circular-column',
  'general',
] as const;
export type MemberTypeV2 = (typeof memberTypesV2)[number];

/** Units a bag's stated yield can be entered in. */
export const yieldUnits = ['l', 'm3', 'ft3'] as const;
export type YieldUnit = (typeof yieldUnits)[number];

export const concreteQuantityInputV2 = z.strictObject({
  memberType: z.enum(memberTypesV2),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  depth: decimal.optional(),
  diameter: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
  overagePercent: decimal.optional(),
  bagYield: decimal.optional(),
  bagYieldUnit: z.enum(yieldUnits).optional(),
  /** Optional UI precision metadata. Absence preserves the historical engine contract. */
  decimalPlaces: z.enum(['2', '3', '4']).optional(),
});

/** No operation params: precision metadata is an optional, persisted input field. */
export const concreteQuantityParamsV2 = z.strictObject({});

export const concreteQuantityOutputV2 = z.strictObject({
  memberType: z.enum(memberTypesV2),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  overagePercent: z.string(),
  netVolumeM3: z.string(),
  netVolumeFt3: z.string(),
  netVolumeYd3: z.string(),
  overageVolumeM3: z.string(),
  orderVolumeM3: z.string(),
  orderVolumeFt3: z.string(),
  orderVolumeYd3: z.string(),
  bagYield: z.string().optional(),
  bagYieldUnit: z.enum(yieldUnits).optional(),
  bags: z.string().optional(),
  working: z.array(workingStepSchema),
});

export type ConcreteQuantityInputV2 = z.infer<typeof concreteQuantityInputV2>;
