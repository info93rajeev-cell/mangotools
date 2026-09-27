import { err, ok, type Result } from '@mangotools/core';
import { add, compare, div, mul, sub } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';

/**
 * All area/coverage/litres math stays in the selected input unit's own squared form throughout — no
 * conversion to metres — because coverage per litre is defined in that same unit (see units.ts).
 */
export function computePaint(m: Measured): Result<Computed> {
  const grossAreaPerSurface = mul(m.length, m.secondDimension);
  if (compare(m.openingArea, grossAreaPerSurface) >= 0) {
    return err('CIVIL_OPENING_EXCEEDS_SURFACE_AREA', { path: 'openingArea' });
  }

  const grossArea = mul(grossAreaPerSurface, m.quantity);
  const openingDeductionArea = mul(m.openingArea, m.quantity);
  const netArea = sub(grossArea, openingDeductionArea);
  const coatedArea = mul(netArea, m.coats);
  const paintLitresBeforeWastage = div(coatedArea, m.coveragePerLitre);
  const wastageLitres = mul(paintLitresBeforeWastage, mul(m.wastagePercent, '0.01'));
  const totalPaintLitres = add(paintLitresBeforeWastage, wastageLitres);

  return ok({
    grossAreaPerSurface,
    grossArea,
    openingDeductionArea,
    netArea,
    coatedArea,
    paintLitresBeforeWastage,
    totalPaintLitres,
  });
}
