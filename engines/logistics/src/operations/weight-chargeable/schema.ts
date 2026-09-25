import { z } from 'zod';
import { lengthUnits, weightUnits } from './units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const chargeableInput = z.strictObject({
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
  weight: decimal.optional(),
  weightUnit: z.enum(weightUnits),
  divisor: decimal.optional(),
});

export const chargeableParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const billedOn = z.enum(['actual', 'volumetric', 'equal']);

export const chargeableOutput = z.strictObject({
  volumetricPerPackage: z.string(),
  volumetricTotal: z.string(),
  actualPerPackage: z.string(),
  actualTotal: z.string(),
  chargeablePerPackage: z.string(),
  chargeableTotal: z.string(),
  billedOn,
  volumeCm3PerPackage: z.string(),
  divisor: z.string(),
  quantity: z.string(),
  working: z.array(workingStep),
});

export type ChargeableInput = z.infer<typeof chargeableInput>;
export type BilledOn = z.infer<typeof billedOn>;
