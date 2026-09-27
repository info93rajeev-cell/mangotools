import type { WorkingStep } from '@mangotools/core';
import type { Computed, Measured } from './types.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with full-precision values (templates come from the tool preset). */
export function workingSteps(m: Measured, c: Computed): WorkingStep[] {
  return [
    step(
      'grossAreaPerSurface',
      'paint.grossAreaPerSurface',
      { length: m.length, secondDimension: m.secondDimension, unit: m.unit },
      c.grossAreaPerSurface,
    ),
    step(
      'grossArea',
      'paint.grossArea',
      { grossAreaPerSurface: c.grossAreaPerSurface, quantity: m.quantity, unit: m.unit },
      c.grossArea,
    ),
    step(
      'openingDeduction',
      'paint.openingDeduction',
      { openingArea: m.openingArea, quantity: m.quantity, unit: m.unit },
      c.openingDeductionArea,
    ),
    step(
      'netArea',
      'paint.netArea',
      { grossArea: c.grossArea, openingDeduction: c.openingDeductionArea, unit: m.unit },
      c.netArea,
    ),
    step(
      'coatedArea',
      'paint.coatedArea',
      { netArea: c.netArea, coats: m.coats, unit: m.unit },
      c.coatedArea,
    ),
    step(
      'paintLitresBeforeWastage',
      'paint.litresBeforeWastage',
      { coatedArea: c.coatedArea, coveragePerLitre: m.coveragePerLitre, unit: m.unit },
      c.paintLitresBeforeWastage,
    ),
    step(
      'totalPaintLitres',
      'paint.totalLitres',
      { paintLitresBeforeWastage: c.paintLitresBeforeWastage, wastagePercent: m.wastagePercent },
      c.totalPaintLitres,
    ),
  ];
}

export function buildOutput(
  m: Measured,
  c: Computed,
  shown: (value: string) => string,
  working: WorkingStep[],
) {
  return {
    unit: m.unit,
    quantity: m.quantity,
    coats: m.coats,
    coveragePerLitre: m.coveragePerLitre,
    wastagePercent: m.wastagePercent,
    grossArea: shown(c.grossArea),
    openingDeductionArea: shown(c.openingDeductionArea),
    netArea: shown(c.netArea),
    coatedArea: shown(c.coatedArea),
    paintLitresBeforeWastage: shown(c.paintLitresBeforeWastage),
    totalPaintLitres: shown(c.totalPaintLitres),
    working,
  };
}
