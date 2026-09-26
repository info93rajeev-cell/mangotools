import { z } from 'zod';
import { palletTypes } from './pallets.ts';
import { lengthUnits } from './units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

export const palletFitInput = z.strictObject({
  unit: z.enum(lengthUnits),
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
  palletType: z.enum(palletTypes),
  palletUnit: z.enum(lengthUnits),
  palletLength: decimal.optional(),
  palletWidth: decimal.optional(),
  maxStackHeight: decimal.optional(),
});

export const palletFitParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
  stackable: z.boolean().default(true),
  allowBaseRotation: z.boolean().default(true),
  keepUpright: z.boolean().default(true),
});

export const orientationCode = z.enum(['lwh', 'lhw', 'wlh', 'whl', 'hlw', 'hwl']);

export const palletFitOutput = z.strictObject({
  bestOrientation: orientationCode,
  cartonsAlongPalletLength: z.string(),
  cartonsAlongPalletWidth: z.string(),
  cartonsPerLayer: z.string(),
  layers: z.string(),
  cartonsPerPallet: z.string(),
  palletsRequired: z.string(),
  cartonsOnLastPallet: z.string(),
  usedAreaPercent: z.string(),
  unusedAreaPercent: z.string(),
  estimatedStackHeight: z.string(),
  leftoverPalletLength: z.string(),
  leftoverPalletWidth: z.string(),
  quantity: z.string(),
  working: z.array(workingStep),
});

export type PalletFitInput = z.infer<typeof palletFitInput>;
export type OrientationCode = z.infer<typeof orientationCode>;
