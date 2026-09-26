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

export const memberTypes = ['general', 'slab', 'beam', 'column', 'footing'] as const;
export type MemberType = (typeof memberTypes)[number];

export const concreteQuantityInput = z.strictObject({
  memberType: z.enum(memberTypes),
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  depth: decimal.optional(),
  quantity: decimal.optional(),
  wastagePercent: decimal.optional(),
});

export const concreteQuantityParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const concreteQuantityOutput = z.strictObject({
  memberType: z.enum(memberTypes),
  unit: z.enum(lengthUnits),
  quantity: z.string(),
  wastagePercent: z.string(),
  baseVolumeM3: z.string(),
  wastageVolumeM3: z.string(),
  totalVolumeM3: z.string(),
  totalVolumeFt3: z.string(),
  working: z.array(workingStep),
});

export type ConcreteQuantityInput = z.infer<typeof concreteQuantityInput>;
export type ConcreteQuantityParams = z.infer<typeof concreteQuantityParams>;
export type ConcreteQuantityOutput = z.infer<typeof concreteQuantityOutput>;
