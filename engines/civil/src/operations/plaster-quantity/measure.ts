import { ok, type Result } from '@mangotools/core';
import { readCount, readNonNegative, readPercent, readPositive } from '../../lib/read-input.ts';
import type { PlasterQuantityInput } from './schema.ts';
import type { Measured } from './types.ts';
import {
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  WASTAGE_DECIMALS,
  WASTAGE_MAX,
  WASTAGE_MIN,
} from './units.ts';

/** Reads every field, stopping at the first invalid one. */
export function measure(input: PlasterQuantityInput): Result<Measured> {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const secondDimension = readPositive(
    input.secondDimension,
    'secondDimension',
    DIMENSION_DECIMALS,
  );
  if (!secondDimension.ok) return secondDimension;
  const plasterThickness = readPositive(
    input.plasterThickness,
    'plasterThickness',
    DIMENSION_DECIMALS,
  );
  if (!plasterThickness.ok) return plasterThickness;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
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
    length: length.value,
    secondDimension: secondDimension.value,
    plasterThickness: plasterThickness.value,
    quantity: quantity.value,
    unit: input.unit,
    surfaceType: input.surfaceType,
    openingArea: openingArea.value,
    wastagePercent: wastagePercent.value,
  });
}
