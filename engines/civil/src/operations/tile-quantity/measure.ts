import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import { readCount, readPercent, readPositive } from '../../lib/read-input.ts';
import type { TileQuantityInput } from './schema.ts';
import type { Measured } from './types.ts';
import {
  DIMENSION_DECIMALS,
  MAX_QUANTITY,
  MAX_TILES_PER_BOX,
  WASTAGE_DECIMALS,
  WASTAGE_MAX,
  WASTAGE_MIN,
} from './units.ts';

/**
 * Tiles per box is genuinely optional: left blank, box count is simply not calculated. No existing
 * civil helper supports "blank is fine, but if present it must be a positive whole number", so this
 * stays local rather than changing the shared `readCount` (which always treats blank as an error).
 */
export function readOptionalTilesPerBox(raw: string | number | undefined): Result<string | null> {
  const text = raw === undefined ? '' : typeof raw === 'number' ? String(raw) : raw;
  if (text.trim() === '') return ok(null);
  const parsed = parseDecimal(text);
  if (!parsed.ok) return err('CIVIL_INVALID_NUMBER', { path: 'tilesPerBox' });
  if (compare(parsed.value, '0') <= 0) {
    return err('CIVIL_TILES_PER_BOX_NOT_POSITIVE', { path: 'tilesPerBox' });
  }
  if (parsed.value.includes('.')) {
    return err('CIVIL_TILES_PER_BOX_NOT_WHOLE', { path: 'tilesPerBox' });
  }
  if (compare(parsed.value, MAX_TILES_PER_BOX) > 0) {
    return err('CIVIL_TILES_PER_BOX_TOO_LARGE', {
      path: 'tilesPerBox',
      details: { max: '100,000' },
    });
  }
  return ok(parsed.value);
}

/** Reads every field, stopping at the first invalid one. */
export function measure(input: TileQuantityInput): Result<Measured> {
  const surfaceLength = readPositive(input.surfaceLength, 'surfaceLength', DIMENSION_DECIMALS);
  if (!surfaceLength.ok) return surfaceLength;
  const surfaceWidth = readPositive(input.surfaceWidth, 'surfaceWidth', DIMENSION_DECIMALS);
  if (!surfaceWidth.ok) return surfaceWidth;
  const tileLength = readPositive(input.tileLength, 'tileLength', DIMENSION_DECIMALS);
  if (!tileLength.ok) return tileLength;
  const tileWidth = readPositive(input.tileWidth, 'tileWidth', DIMENSION_DECIMALS);
  if (!tileWidth.ok) return tileWidth;
  const quantity = readCount(input.quantity, 'quantity', MAX_QUANTITY);
  if (!quantity.ok) return quantity;
  const wastagePercent = readPercent(input.wastagePercent, 'wastagePercent', {
    min: WASTAGE_MIN,
    max: WASTAGE_MAX,
    maxDecimals: WASTAGE_DECIMALS,
    rangeCode: 'CIVIL_WASTAGE_OUT_OF_RANGE',
  });
  if (!wastagePercent.ok) return wastagePercent;
  const tilesPerBox = readOptionalTilesPerBox(input.tilesPerBox);
  if (!tilesPerBox.ok) return tilesPerBox;
  return ok({
    surfaceLength: surfaceLength.value,
    surfaceWidth: surfaceWidth.value,
    tileLength: tileLength.value,
    tileWidth: tileWidth.value,
    unit: input.unit,
    quantity: quantity.value,
    wastagePercent: wastagePercent.value,
    tilesPerBox: tilesPerBox.value,
  });
}
