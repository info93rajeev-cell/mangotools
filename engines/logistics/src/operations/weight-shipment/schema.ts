import { z } from 'zod';
import { lengthUnits, weightUnits } from '../weight-chargeable/units.ts';

const decimal = z.union([z.string(), z.number()]);

const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});

const packageSchema = z.strictObject({
  length: decimal.optional(),
  width: decimal.optional(),
  height: decimal.optional(),
  quantity: decimal.optional(),
  weightPerPiece: decimal.optional(),
});

export const weightShipmentInput = z.strictObject({
  unit: z.enum(lengthUnits),
  weightUnit: z.enum(weightUnits),
  divisor: decimal.optional(),
  packages: z.array(packageSchema).min(1).max(50),
  decimalPlaces: z.enum(['2', '3', '4']).optional(),
});

export const weightShipmentParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});

export const billedOn = z.enum(['actual', 'volumetric', 'equal']);

const rowOutput = z.strictObject({
  index: z.int().min(0).max(49),
  quantity: z.string(),
  volumeCm3PerPiece: z.string(),
  volumetricPerPiece: z.string(),
  volumetricTotal: z.string(),
  actualPerPiece: z.string(),
  actualTotal: z.string(),
  chargeableTotal: z.string(),
  billedOn,
});

export const weightShipmentOutput = z.strictObject({
  rows: z.array(rowOutput).min(1).max(50),
  totalPieces: z.string(),
  totalVolumeCm3: z.string(),
  totalVolumeM3: z.string(),
  volumetricTotal: z.string(),
  actualTotal: z.string(),
  chargeableTotal: z.string(),
  billedOn,
  divisor: z.string(),
  working: z.array(workingStep),
});

export type WeightShipmentInput = z.infer<typeof weightShipmentInput>;
export type WeightShipmentParams = z.infer<typeof weightShipmentParams>;
export type WeightShipmentOutput = z.infer<typeof weightShipmentOutput>;
export type ShipmentPackage = WeightShipmentInput['packages'][number];
export type BilledOn = z.infer<typeof billedOn>;
