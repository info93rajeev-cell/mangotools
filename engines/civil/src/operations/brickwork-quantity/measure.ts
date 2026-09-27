import { ok, type Result } from '@mangotools/core';
import { readCount, readNonNegative, readPercent, readPositive } from '../../lib/read-input.ts';
import type { BrickworkQuantityInput } from './schema.ts';
import type { Measured } from './types.ts';
import {
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  WASTAGE_DECIMALS,
  WASTAGE_MAX,
  WASTAGE_MIN,
} from './units.ts';

/** Reads every field, stopping at the first invalid one. */
export function measure(input: BrickworkQuantityInput): Result<Measured> {
  const wallLength = readPositive(input.wallLength, 'wallLength', DIMENSION_DECIMALS);
  if (!wallLength.ok) return wallLength;
  const wallHeight = readPositive(input.wallHeight, 'wallHeight', DIMENSION_DECIMALS);
  if (!wallHeight.ok) return wallHeight;
  const wallThickness = readPositive(input.wallThickness, 'wallThickness', DIMENSION_DECIMALS);
  if (!wallThickness.ok) return wallThickness;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const brickLength = readPositive(input.brickLength, 'brickLength', DIMENSION_DECIMALS);
  if (!brickLength.ok) return brickLength;
  const brickWidth = readPositive(input.brickWidth, 'brickWidth', DIMENSION_DECIMALS);
  if (!brickWidth.ok) return brickWidth;
  const brickHeight = readPositive(input.brickHeight, 'brickHeight', DIMENSION_DECIMALS);
  if (!brickHeight.ok) return brickHeight;
  const mortarJointMm = readNonNegative(input.mortarJointMm, 'mortarJointMm', DIMENSION_DECIMALS);
  if (!mortarJointMm.ok) return mortarJointMm;
  const openingArea = readNonNegative(input.openingArea, 'openingArea', DIMENSION_DECIMALS);
  if (!openingArea.ok) return openingArea;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: WASTAGE_MIN,
    max: WASTAGE_MAX,
    maxDecimals: WASTAGE_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  return ok({
    wallLength: wallLength.value,
    wallHeight: wallHeight.value,
    wallThickness: wallThickness.value,
    quantity: quantity.value,
    unit: input.unit,
    brickLength: brickLength.value,
    brickWidth: brickWidth.value,
    brickHeight: brickHeight.value,
    brickUnit: input.brickUnit,
    mortarJointMm: mortarJointMm.value,
    openingArea: openingArea.value,
    wastagePercent: wastagePercent.value,
  });
}
