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

export const excavationTypes = ['general', 'trench', 'footing'] as const;
export type ExcavationType = (typeof excavationTypes)[number];

export const excavationVolumeInput = z.strictObject({
  excavationType: z.enum(excavationTypes),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  depth: decimal.optional(),
  quantity: decimal.optional(),
  bulkingPercent: decimal.optional(),
});

export const excavationVolumeParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const excavationVolumeOutput = z.strictObject({
  excavationType: z.enum(excavationTypes),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  bulkingPercent: z.string(),
  neatVolumeM3: z.string(),
  bulkingVolumeM3: z.string(),
  looseVolumeM3: z.string(),
  looseVolumeFt3: z.string(),
  working: z.array(workingStep),
});

export type ExcavationVolumeInput = z.infer<typeof excavationVolumeInput>;
export type ExcavationVolumeParams = z.infer<typeof excavationVolumeParams>;
export type ExcavationVolumeOutput = z.infer<typeof excavationVolumeOutput>;
