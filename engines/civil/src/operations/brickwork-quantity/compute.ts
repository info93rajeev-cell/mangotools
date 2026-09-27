import { err, ok, type Result } from '@mangotools/core';
import { add, compare, div, mul, sub } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';
import {
  CUBIC_FEET_PER_CUBIC_METRE,
  METRES_PER_UNIT,
  SQUARE_FEET_PER_SQUARE_METRE,
} from './units.ts';

/** Every value here is exact (unrounded); the operation rounds each one once, for display. */
export function computeBrickwork(m: Measured): Result<Computed> {
  const wallFactor = METRES_PER_UNIT[m.unit];
  const brickFactor = METRES_PER_UNIT[m.brickUnit];
  const lengthM = mul(m.wallLength, wallFactor);
  const heightM = mul(m.wallHeight, wallFactor);
  const wallThicknessM = mul(m.wallThickness, wallFactor);
  const openingAreaM2 = mul(m.openingArea, mul(wallFactor, wallFactor));

  const grossAreaPerWallM2 = mul(lengthM, heightM);
  if (compare(openingAreaM2, grossAreaPerWallM2) > 0) {
    return err('CIVIL_OPENING_EXCEEDS_WALL_AREA', { path: 'openingArea' });
  }

  const grossWallAreaM2 = mul(grossAreaPerWallM2, m.quantity);
  const openingDeductionAreaM2 = mul(openingAreaM2, m.quantity);
  const netWallAreaM2 = sub(grossWallAreaM2, openingDeductionAreaM2);
  const netWallAreaFt2 = mul(netWallAreaM2, SQUARE_FEET_PER_SQUARE_METRE);

  const brickworkVolumeM3 = mul(netWallAreaM2, wallThicknessM);
  const brickworkVolumeFt3 = mul(brickworkVolumeM3, CUBIC_FEET_PER_CUBIC_METRE);

  const mortarM = mul(m.mortarJointMm, '0.001');
  const brickLengthM = add(mul(m.brickLength, brickFactor), mortarM);
  const brickWidthM = add(mul(m.brickWidth, brickFactor), mortarM);
  const brickHeightM = add(mul(m.brickHeight, brickFactor), mortarM);
  const effectiveBrickVolumeM3 = mul(mul(brickLengthM, brickWidthM), brickHeightM);

  const estimatedBrickCount = div(brickworkVolumeM3, effectiveBrickVolumeM3, 10);
  const wastageBricks = mul(estimatedBrickCount, mul(m.wastagePercent, '0.01'));
  const totalBricks = add(estimatedBrickCount, wastageBricks);

  return ok({
    grossAreaPerWallM2,
    grossWallAreaM2,
    openingAreaM2,
    openingDeductionAreaM2,
    netWallAreaM2,
    netWallAreaFt2,
    wallThicknessM,
    brickworkVolumeM3,
    brickworkVolumeFt3,
    effectiveBrickVolumeM3,
    estimatedBrickCount,
    wastageBricks,
    totalBricks,
  });
}
