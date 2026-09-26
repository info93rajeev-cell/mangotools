import { z } from 'zod';
import { containerTypes } from './containers.ts';
import { lengthUnits } from './units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const containerFitInput = z.strictObject({
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
  containerType: z.enum(containerTypes),
  containerUnit: z.enum(lengthUnits).optional(),
  containerLength: decimal.optional(),
  containerWidth: decimal.optional(),
  containerHeight: decimal.optional(),
  usablePercent: decimal.optional(),
});

export const containerFitParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
  stackable: z.boolean().default(true),
  allowRotation: z.boolean().default(true),
  keepUpright: z.boolean().default(false),
});

export const orientationCode = z.enum(['lwh', 'lhw', 'wlh', 'whl', 'hlw', 'hwl']);

export const containerFitOutput = z.strictObject({
  cartonCbm: z.string(),
  totalCbm: z.string(),
  containerCbm: z.string(),
  usableCbm: z.string(),
  volumeFillPercent: z.string(),
  cartonsByVolume: z.string(),
  remainingCbm: z.string(),
  bestOrientation: orientationCode,
  cartonsAlongLength: z.string(),
  cartonsAlongWidth: z.string(),
  cartonsAlongHeight: z.string(),
  maxCartonsByGrid: z.string(),
  gridUtilizationPercent: z.string(),
  cartonsLeftAfterGrid: z.string(),
  leftoverLength: z.string(),
  leftoverWidth: z.string(),
  leftoverHeight: z.string(),
  quantity: z.string(),
  working: z.array(workingStep),
});

export type ContainerFitInput = z.infer<typeof containerFitInput>;
export type OrientationCode = z.infer<typeof orientationCode>;
