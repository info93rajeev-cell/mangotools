import type { OpError, OpWarning } from '@mangotools/core';

export interface CbmPackage {
  id: number;
  description: string;
  length: string;
  width: string;
  height: string;
  unit: string;
  quantity: string;
  weightPerItem: string;
  weightUnit: string;
}
export interface CbmRowResult {
  index: number;
  quantity: string;
  cbmPerPieceExact: string;
  cbmPerPiece: string;
  totalCbmExact: string;
  totalCbm: string;
  totalWeightKgExact: string | null;
  totalWeightKg: string | null;
}
/** Numeric output projection of the validated shipment operation. No descriptions cross the worker boundary. */
export interface CbmResult {
  rows: CbmRowResult[];
  totalCbmExact: string;
  totalCbm: string;
  totalCft: string;
  totalPieces: string;
  knownPackedWeightKg: string | null;
  weightCoverage: 'none' | 'partial' | 'complete';
  weightedPieces: string;
}
export interface CbmCostInput {
  enabled: boolean;
  currency: string;
  rate: string;
  minimumCharge: string;
  otherCharges: string;
}
export interface CbmCostResult {
  currency: string;
  quantity: string;
  rate: string;
  baseCharge: string;
  minimumCharge: string | null;
  minimumApplied: boolean;
  freightCharge: string;
  otherCharges: string;
  estimatedTotal: string;
}
export interface CbmSnapshot {
  packages: CbmPackage[];
  unit: string;
  precision: string;
  costInput: CbmCostInput;
  shipment: CbmResult | null;
  cost: CbmCostResult | null;
  pending: boolean;
  error: OpError | null;
  costError: OpError | null;
  warnings: OpWarning[];
}
export function newPackage(id: number, unit = 'cm'): CbmPackage {
  return {
    id,
    description: '',
    length: '',
    width: '',
    height: '',
    unit,
    quantity: '1',
    weightPerItem: '',
    weightUnit: 'kg',
  };
}
export function samplePackages(): CbmPackage[] {
  return [{ ...newPackage(0), length: '50', width: '40', height: '30', quantity: '100' }];
}
export const packagePayload = (row: CbmPackage) => ({
  length: row.length,
  width: row.width,
  height: row.height,
  unit: row.unit,
  quantity: row.quantity,
  ...(row.weightPerItem.trim()
    ? { weightPerItem: row.weightPerItem, weightUnit: row.weightUnit }
    : {}),
});
