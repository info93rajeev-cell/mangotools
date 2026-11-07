import { err, ok, type Result } from '@mangotools/core';
import { compare, div, mul } from '@mangotools/engine-numeric';
import { readCount, readPositive } from '../../lib/read-input.ts';
import { MAX_QUANTITY } from '../cbm-compute/units.ts';
import {
  CUBIC_CM_PER_CUBED_UNIT,
  INPUT_DECIMALS,
  KG_PER_WEIGHT_UNIT,
  MAX_WEIGHT_KG,
} from '../weight-chargeable/units.ts';
import type { ShipmentPackage, WeightShipmentInput } from './schema.ts';

/** One package row at full precision: volumes in cm³, weights in kg. */
export interface MeasuredRow {
  index: number;
  length: string;
  width: string;
  height: string;
  quantity: string;
  weight: string;
  volumeCm3PerPiece: string;
  volumeCm3Total: string;
  volumetricPerPiece: string;
  volumetricTotal: string;
  actualPerPiece: string;
  actualTotal: string;
}

type Units = Pick<WeightShipmentInput, 'unit' | 'weightUnit'>;

/** Reads one row in field order, stopping at the first invalid value; paths name the row. */
export function measureRow(
  row: ShipmentPackage,
  index: number,
  units: Units,
  divisor: string,
): Result<MeasuredRow> {
  const path = `packages.${index}`;
  const length = readPositive(row.length, `${path}.length`, INPUT_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(row.width, `${path}.width`, INPUT_DECIMALS);
  if (!width.ok) return width;
  const height = readPositive(row.height, `${path}.height`, INPUT_DECIMALS);
  if (!height.ok) return height;
  const quantity = readCount(row.quantity, `${path}.quantity`, MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const weight = readPositive(row.weightPerPiece, `${path}.weightPerPiece`, INPUT_DECIMALS);
  if (!weight.ok) return weight;
  const actualPerPiece = mul(weight.value, KG_PER_WEIGHT_UNIT[units.weightUnit]);
  if (compare(actualPerPiece, MAX_WEIGHT_KG) > 0) {
    return err('LOGISTICS_WEIGHT_TOO_LARGE', {
      path: `${path}.weightPerPiece`,
      details: { max: '100,000' },
    });
  }
  const volumePerPiece = mul(
    mul(mul(length.value, width.value), height.value),
    CUBIC_CM_PER_CUBED_UNIT[units.unit],
  );
  const volumetricPerPiece = div(volumePerPiece, divisor);
  const q = quantity.value;
  return ok({
    index,
    length: length.value,
    width: width.value,
    height: height.value,
    quantity: q,
    weight: weight.value,
    volumeCm3PerPiece: volumePerPiece,
    volumeCm3Total: mul(volumePerPiece, q),
    volumetricPerPiece,
    volumetricTotal: mul(volumetricPerPiece, q),
    actualPerPiece,
    actualTotal: mul(actualPerPiece, q),
  });
}
