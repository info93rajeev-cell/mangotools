import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import { readCount, readNonNegative, readPercent, readPositive } from '../../lib/read-input.ts';
import type { PaintQuantityInput } from './schema.ts';
import type { Measured } from './types.ts';
import {
  DIMENSION_DECIMALS,
  MAX_COATS,
  MAX_QUANTITY,
  WASTAGE_DECIMALS,
  WASTAGE_MAX,
  WASTAGE_MIN,
} from './units.ts';

type Raw = string | number | undefined;
const text = (raw: string | number) => (typeof raw === 'number' ? String(raw) : raw);

/**
 * Number of coats is a required positive whole number. No existing civil helper fits this wording
 * ("coats", not "members" or "tiles per box"), so this stays local rather than reusing `readCount`.
 */
function readCoats(raw: Raw, path: string): Result<string> {
  if (raw === undefined || text(raw).trim() === '') return err('CIVIL_MISSING_INPUT', { path });
  const parsed = parseDecimal(text(raw));
  if (!parsed.ok) return err('CIVIL_INVALID_NUMBER', { path });
  if (compare(parsed.value, '0') <= 0) return err('CIVIL_COATS_NOT_POSITIVE', { path });
  if (parsed.value.includes('.')) return err('CIVIL_COATS_NOT_WHOLE', { path });
  if (compare(parsed.value, MAX_COATS) > 0) {
    return err('CIVIL_COATS_TOO_LARGE', { path, details: { max: MAX_COATS } });
  }
  return ok(parsed.value);
}

/** Reads every field, stopping at the first invalid one. */
export function measure(input: PaintQuantityInput): Result<Measured> {
  const length = readPositive(input.length, 'length', DIMENSION_DECIMALS);
  if (!length.ok) return length;
  const secondDimension = readPositive(
    input.secondDimension,
    'secondDimension',
    DIMENSION_DECIMALS,
  );
  if (!secondDimension.ok) return secondDimension;
  const openingArea = readNonNegative(input.openingArea, 'openingArea', DIMENSION_DECIMALS);
  if (!openingArea.ok) return openingArea;
  const coats = readCoats(input.coats, 'coats');
  if (!coats.ok) return coats;
  const coveragePerLitre = readPositive(
    input.coveragePerLitre,
    'coveragePerLitre',
    DIMENSION_DECIMALS,
  );
  if (!coveragePerLitre.ok) return coveragePerLitre;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: WASTAGE_MIN,
    max: WASTAGE_MAX,
    maxDecimals: WASTAGE_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  return ok({
    length: length.value,
    secondDimension: secondDimension.value,
    unit: input.unit,
    openingArea: openingArea.value,
    coats: coats.value,
    coveragePerLitre: coveragePerLitre.value,
    wastagePercent: wastagePercent.value,
    quantity: quantity.value,
  });
}
