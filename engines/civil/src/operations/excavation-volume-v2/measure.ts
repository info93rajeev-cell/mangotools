import { ok, type Result } from '@mangotools/core';
import {
  readCount,
  readOptionalPositive,
  readPercent,
  readPositive,
} from '../../lib/read-input.ts';
import {
  type LengthUnit,
  MAX_COUNT,
  MEASURE_DECIMALS,
  PERCENT_DECIMALS,
} from '../../lib/units-v2.ts';
import type { ExcavationVolumeInputV2, TruckUnit } from './schema.ts';

export type Shape =
  | { kind: 'rectangular'; length: string; width: string; depth: string }
  | { kind: 'circular'; diameter: string; depth: string };

export interface Measured {
  excavationType: ExcavationVolumeInputV2['excavationType'];
  unit: LengthUnit;
  shape: Shape;
  quantity: string;
  swellPercent: string;
  displayDecimals: number | null;
  truck: { capacity: string; unit: TruckUnit } | null;
}

function readShape(input: ExcavationVolumeInputV2): Result<Shape> {
  if (input.excavationType === 'circular') {
    const diameter = readPositive(input.diameter, 'diameter', MEASURE_DECIMALS);
    if (!diameter.ok) return diameter;
    const depth = readPositive(input.depth, 'depth', MEASURE_DECIMALS);
    if (!depth.ok) return depth;
    return ok({ kind: 'circular', diameter: diameter.value, depth: depth.value });
  }
  const length = readPositive(input.length, 'length', MEASURE_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', MEASURE_DECIMALS);
  if (!width.ok) return width;
  const depth = readPositive(input.depth, 'depth', MEASURE_DECIMALS);
  if (!depth.ok) return depth;
  return ok({ kind: 'rectangular', length: length.value, width: width.value, depth: depth.value });
}

/** Reads every field in form order, stopping at the first invalid one. */
export function measure(input: ExcavationVolumeInputV2): Result<Measured> {
  const shape = readShape(input);
  if (!shape.ok) return shape;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const displayDecimals = input.decimalPlaces ? Number(input.decimalPlaces) : null;
  const swellPercent = readPercent(input.swellPercent, 'swellPercent', {
    min: '0',
    max: '100',
    maxDecimals: displayDecimals ?? PERCENT_DECIMALS,
    rangeCode: 'CIVIL_SWELL_OUT_OF_RANGE',
  });
  if (!swellPercent.ok) return swellPercent;
  const capacity = readOptionalPositive(input.truckCapacity, 'truckCapacity', MEASURE_DECIMALS);
  if (!capacity.ok) return capacity;
  return ok({
    excavationType: input.excavationType,
    unit: input.unit,
    shape: shape.value,
    quantity: quantity.value,
    swellPercent: swellPercent.value,
    displayDecimals,
    truck: capacity.value
      ? { capacity: capacity.value, unit: input.truckCapacityUnit ?? 'm3' }
      : null,
  });
}
