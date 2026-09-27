import { err, ok, type Result } from '@mangotools/core';
import { add, compare, mul, sub } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';
import {
  CUBIC_FEET_PER_CUBIC_METRE,
  METRES_PER_UNIT,
  SQUARE_FEET_PER_SQUARE_METRE,
} from './units.ts';

/** Every value here is exact (unrounded); the operation rounds each one once, for display. */
export function computePlaster(m: Measured): Result<Computed> {
  const factor = METRES_PER_UNIT[m.unit];
  const lengthM = mul(m.length, factor);
  const secondDimensionM = mul(m.secondDimension, factor);
  const plasterThicknessM = mul(m.plasterThickness, factor);
  const openingAreaM2 = mul(m.openingArea, mul(factor, factor));

  const grossAreaPerSurfaceM2 = mul(lengthM, secondDimensionM);
  if (compare(openingAreaM2, grossAreaPerSurfaceM2) > 0) {
    return err('CIVIL_OPENING_EXCEEDS_SURFACE_AREA', { path: 'openingArea' });
  }

  const grossAreaM2 = mul(grossAreaPerSurfaceM2, m.quantity);
  const openingDeductionAreaM2 = mul(openingAreaM2, m.quantity);
  const netAreaM2 = sub(grossAreaM2, openingDeductionAreaM2);
  const netAreaFt2 = mul(netAreaM2, SQUARE_FEET_PER_SQUARE_METRE);

  const plasterVolumeM3 = mul(netAreaM2, plasterThicknessM);
  const wastageVolumeM3 = mul(plasterVolumeM3, mul(m.wastagePercent, '0.01'));
  const totalVolumeM3 = add(plasterVolumeM3, wastageVolumeM3);
  const totalVolumeFt3 = mul(totalVolumeM3, CUBIC_FEET_PER_CUBIC_METRE);

  return ok({
    grossAreaPerSurfaceM2,
    grossAreaM2,
    openingAreaM2,
    openingDeductionAreaM2,
    netAreaM2,
    netAreaFt2,
    plasterThicknessM,
    plasterVolumeM3,
    wastageVolumeM3,
    totalVolumeM3,
    totalVolumeFt3,
  });
}
