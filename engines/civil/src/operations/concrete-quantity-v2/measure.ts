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
import type { ConcreteQuantityInputV2, MemberTypeV2, YieldUnit } from './schema.ts';

export type Shape =
  | { kind: 'rectangular'; length: string; width: string; depth: string }
  | { kind: 'circular'; diameter: string; height: string };

export interface Measured {
  memberType: MemberTypeV2;
  unit: LengthUnit;
  shape: Shape;
  quantity: string;
  overagePercent: string;
  displayDecimals: number | null;
  bag: { yield: string; unit: YieldUnit } | null;
}

function readShape(input: ConcreteQuantityInputV2): Result<Shape> {
  if (input.memberType === 'circular-column') {
    const diameter = readPositive(input.diameter, 'diameter', MEASURE_DECIMALS);
    if (!diameter.ok) return diameter;
    const height = readPositive(input.height, 'height', MEASURE_DECIMALS);
    if (!height.ok) return height;
    return ok({ kind: 'circular', diameter: diameter.value, height: height.value });
  }
  const length = readPositive(input.length, 'length', MEASURE_DECIMALS);
  if (!length.ok) return length;
  const width = readPositive(input.width, 'width', MEASURE_DECIMALS);
  if (!width.ok) return width;
  const depth = readPositive(input.depth, 'depth', MEASURE_DECIMALS);
  if (!depth.ok) return depth;
  return ok({ kind: 'rectangular', length: length.value, width: width.value, depth: depth.value });
}

/** Reads the member, count, overage and optional bag yield, stopping at the first invalid field. */
export function measure(input: ConcreteQuantityInputV2): Result<Measured> {
  const shape = readShape(input);
  if (!shape.ok) return shape;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const displayDecimals = input.decimalPlaces ? Number(input.decimalPlaces) : null;
  const overagePercent = readPercent(input.overagePercent, 'overagePercent', {
    min: '0',
    max: '50',
    maxDecimals: displayDecimals ?? PERCENT_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!overagePercent.ok) return overagePercent;
  const bagYield = readOptionalPositive(input.bagYield, 'bagYield', MEASURE_DECIMALS);
  if (!bagYield.ok) return bagYield;
  return ok({
    memberType: input.memberType,
    unit: input.unit,
    shape: shape.value,
    quantity: quantity.value,
    overagePercent: overagePercent.value,
    displayDecimals,
    bag: bagYield.value ? { yield: bagYield.value, unit: input.bagYieldUnit ?? 'l' } : null,
  });
}
