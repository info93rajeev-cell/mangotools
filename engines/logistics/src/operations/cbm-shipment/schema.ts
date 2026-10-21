import { z } from 'zod';

export const dimensionUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export const weightUnits = ['kg', 'g', 'lb'] as const;
const packageSchema = z.strictObject({
  length: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  unit: z.enum(dimensionUnits),
  quantity: z.string().optional(),
  weightPerItem: z.string().optional(),
  weightUnit: z.enum(weightUnits).optional(),
});
export const shipmentInput = z.strictObject({
  packages: z.array(packageSchema).min(1).max(50),
  decimalPlaces: z.enum(['2', '3', '4']).optional(),
});
export const shipmentParams = z.strictObject({
  decimals: z.int().min(0).max(6).default(3),
  rounding: z.enum(['half-up', 'half-even']).default('half-up'),
});
const workingStep = z.strictObject({
  ref: z.string(),
  formulaKey: z.string(),
  variables: z.record(z.string(), z.string()),
  result: z.string(),
  noteKey: z.string().optional(),
});
const rowOutput = z.strictObject({
  index: z.int().min(0).max(49),
  quantity: z.string(),
  cbmPerPieceExact: z.string(),
  cbmPerPiece: z.string(),
  totalCbmExact: z.string(),
  totalCbm: z.string(),
  totalWeightKgExact: z.string().nullable(),
  totalWeightKg: z.string().nullable(),
});
export const shipmentOutput = z.strictObject({
  rows: z.array(rowOutput).min(1).max(50),
  totalCbmExact: z.string(),
  totalCbm: z.string(),
  totalCftExact: z.string(),
  totalCft: z.string(),
  totalPieces: z.string(),
  knownPackedWeightKgExact: z.string().nullable(),
  knownPackedWeightKg: z.string().nullable(),
  weightCoverage: z.enum(['none', 'partial', 'complete']),
  weightedPieces: z.string(),
  weightedRowCount: z.int().min(0).max(50),
  working: z.array(workingStep),
});
export type ShipmentInput = z.infer<typeof shipmentInput>;
export type ShipmentParams = z.infer<typeof shipmentParams>;
export type ShipmentOutput = z.infer<typeof shipmentOutput>;
export type PackageInput = ShipmentInput['packages'][number];
export type PackageOutput = ShipmentOutput['rows'][number];
