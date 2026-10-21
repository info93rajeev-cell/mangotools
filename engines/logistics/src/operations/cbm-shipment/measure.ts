import { err, ok, type Result } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import { readMeasurement, readQuantity } from './read-measurement.ts';
import type { PackageInput } from './schema.ts';
import { KILOGRAMS, METRES } from './units.ts';

export interface MeasuredPackage {
  index: number;
  length: string;
  width: string;
  height: string;
  quantity: string;
  cbmPerPieceExact: string;
  totalCbmExact: string;
  totalWeightKgExact: string | null;
}

function packedWeight(row: PackageInput, quantity: string, path: string): Result<string | null> {
  if (row.weightPerItem === undefined || row.weightPerItem.trim() === '') return ok(null);
  const weight = readMeasurement(row.weightPerItem, `${path}.weightPerItem`);
  if (!weight.ok) return weight;
  if (!row.weightUnit) return err('LOGISTICS_WEIGHT_UNIT_REQUIRED', { path: `${path}.weightUnit` });
  return ok(mul(mul(weight.value, KILOGRAMS[row.weightUnit]), quantity));
}

export function measurePackage(row: PackageInput, index: number): Result<MeasuredPackage> {
  const path = `packages.${index}`;
  const length = readMeasurement(row.length, `${path}.length`);
  if (!length.ok) return length;
  const width = readMeasurement(row.width, `${path}.width`);
  if (!width.ok) return width;
  const height = readMeasurement(row.height, `${path}.height`);
  if (!height.ok) return height;
  const quantity = readQuantity(row.quantity, `${path}.quantity`);
  if (!quantity.ok) return quantity;
  const weight = packedWeight(row, quantity.value, path);
  if (!weight.ok) return weight;
  const factor = METRES[row.unit];
  const l = mul(length.value, factor);
  const w = mul(width.value, factor);
  const h = mul(height.value, factor);
  const perPiece = mul(mul(l, w), h);
  return ok({
    index,
    length: l,
    width: w,
    height: h,
    quantity: quantity.value,
    cbmPerPieceExact: perPiece,
    totalCbmExact: mul(perPiece, quantity.value),
    totalWeightKgExact: weight.value,
  });
}
