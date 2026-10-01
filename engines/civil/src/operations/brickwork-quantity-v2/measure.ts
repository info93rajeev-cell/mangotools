import { ok, type Result } from '@mangotools/core';
import { type OpeningRow, readOpenings } from '../../lib/openings.ts';
import {
  readCount,
  readNonNegative,
  readPercent,
  readPositive,
  readWholeInRange,
} from '../../lib/read-input.ts';
import {
  type LengthUnit,
  MAX_COUNT,
  MEASURE_DECIMALS,
  PERCENT_DECIMALS,
} from '../../lib/units-v2.ts';
import type { BrickworkQuantityInputV2 } from './schema.ts';

export const MAX_WYTHES = '4';

export interface Measured {
  unit: LengthUnit;
  brickUnit: LengthUnit;
  wallLength: string;
  wallHeight: string;
  quantity: string;
  wythes: string;
  openings: OpeningRow[];
  brickLength: string;
  brickHeight: string;
  mortarJoint: string;
  wastagePercent: string;
}

/** Reads every field in form order, stopping at the first invalid one. */
export function measure(input: BrickworkQuantityInputV2): Result<Measured> {
  const wallLength = readPositive(input.wallLength, 'wallLength', MEASURE_DECIMALS);
  if (!wallLength.ok) return wallLength;
  const wallHeight = readPositive(input.wallHeight, 'wallHeight', MEASURE_DECIMALS);
  if (!wallHeight.ok) return wallHeight;
  const quantity = readCount(input.quantity, 'quantity', MAX_COUNT);
  if (!quantity.ok) return quantity;
  const wythes = readWholeInRange(input.wythes, 'wythes', {
    max: MAX_WYTHES,
    rangeCode: 'CIVIL_WYTHES_OUT_OF_RANGE',
  });
  if (!wythes.ok) return wythes;
  const openings = readOpenings(input.openings);
  if (!openings.ok) return openings;
  const brickLength = readPositive(input.brickLength, 'brickLength', MEASURE_DECIMALS);
  if (!brickLength.ok) return brickLength;
  const brickHeight = readPositive(input.brickHeight, 'brickHeight', MEASURE_DECIMALS);
  if (!brickHeight.ok) return brickHeight;
  const mortarJoint = readNonNegative(input.mortarJoint, 'mortarJoint', MEASURE_DECIMALS);
  if (!mortarJoint.ok) return mortarJoint;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: '0',
    max: '50',
    maxDecimals: PERCENT_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  return ok({
    unit: input.unit,
    brickUnit: input.brickUnit,
    wallLength: wallLength.value,
    wallHeight: wallHeight.value,
    quantity: quantity.value,
    wythes: wythes.value,
    openings: openings.value,
    brickLength: brickLength.value,
    brickHeight: brickHeight.value,
    mortarJoint: mortarJoint.value,
    wastagePercent: wastagePercent.value,
  });
}
