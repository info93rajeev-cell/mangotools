import { ok, type Result } from '@mangotools/core';
import { add, div, mul, sub } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';
import { METRES_PER_UNIT, SQUARE_FEET_PER_SQUARE_METRE } from './units.ts';

/**
 * Rounds a non-negative decimal string up to the nearest whole number ("10" stays "10", "10.001"
 * becomes "11"). Tile, box and area-ratio counts always round up: a fractional tile or box still
 * needs a whole one.
 */
function ceilToInteger(value: string): string {
  const [intPart, fracPart] = value.split('.');
  const whole = intPart ?? '0';
  return !fracPart || /^0+$/.test(fracPart) ? whole : add(whole, '1');
}

/**
 * Every value here is exact (unrounded) except the three tile/box counts, which round up once each —
 * see `ceilToInteger`. `baseTileCount` is the surface-to-tile area ratio rounded up; `totalTiles` is
 * `baseTileCount × (1 + wastage%)` rounded up in turn (the platform's documented, recommended
 * formula — using the already-rounded base count, not the exact ratio, so a user can recompute the
 * total by hand from the base count they see); `wastageTileCount` is simply their difference, so the
 * three counts always add up exactly.
 */
export function computeTiles(m: Measured): Result<Computed> {
  const factor = METRES_PER_UNIT[m.unit];
  const surfaceLengthM = mul(m.surfaceLength, factor);
  const surfaceWidthM = mul(m.surfaceWidth, factor);
  const tileLengthM = mul(m.tileLength, factor);
  const tileWidthM = mul(m.tileWidth, factor);

  const surfaceAreaPerRoomM2 = mul(surfaceLengthM, surfaceWidthM);
  const surfaceAreaM2 = mul(surfaceAreaPerRoomM2, m.quantity);
  const surfaceAreaFt2 = mul(surfaceAreaM2, SQUARE_FEET_PER_SQUARE_METRE);
  const tileAreaM2 = mul(tileLengthM, tileWidthM);

  const baseTileCount = ceilToInteger(div(surfaceAreaM2, tileAreaM2));
  const wastageFactor = add('1', mul(m.wastagePercent, '0.01'));
  const totalTiles = ceilToInteger(mul(baseTileCount, wastageFactor));
  const wastageTileCount = sub(totalTiles, baseTileCount);

  const boxesRequired =
    m.tilesPerBox === null ? null : ceilToInteger(div(totalTiles, m.tilesPerBox));

  return ok({
    surfaceAreaPerRoomM2,
    surfaceAreaM2,
    surfaceAreaFt2,
    tileAreaM2,
    baseTileCount,
    wastageTileCount,
    totalTiles,
    boxesRequired,
  });
}
