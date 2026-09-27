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
      'plaster.grossAreaPerSurface',
      { length: m.length, secondDimension: m.secondDimension, unit: m.unit },
      c.grossAreaPerSurfaceM2,
    ),
    step(
      'grossArea',
      'plaster.grossArea',
      { grossAreaPerSurface: c.grossAreaPerSurfaceM2, quantity: m.quantity },
      c.grossAreaM2,
    ),
    step(
      'openingDeduction',
      'plaster.openingDeduction',
      { openingArea: c.openingAreaM2, quantity: m.quantity },
      c.openingDeductionAreaM2,
    ),
    step(
      'netArea',
      'plaster.netArea',
      { grossArea: c.grossAreaM2, openingDeduction: c.openingDeductionAreaM2 },
      c.netAreaM2,
    ),
    step(
      'netAreaFt2',
      'plaster.netAreaFt2',
      { netArea: c.netAreaM2, factor: '10.7639104' },
      c.netAreaFt2,
    ),
    step(
      'plasterVolume',
      'plaster.volume',
      { netArea: c.netAreaM2, thickness: c.plasterThicknessM },
      c.plasterVolumeM3,
    ),
    step(
      'wastageVolume',
      'plaster.wastageVolume',
      { plasterVolume: c.plasterVolumeM3, wastagePercent: m.wastagePercent },
      c.wastageVolumeM3,
    ),
    step(
      'totalVolume',
      'plaster.totalVolume',
      { plasterVolume: c.plasterVolumeM3, wastageVolume: c.wastageVolumeM3 },
      c.totalVolumeM3,
    ),
    step(
      'totalVolumeFt3',
      'plaster.totalVolumeFt3',
      { totalVolume: c.totalVolumeM3, factor: '35.3146667' },
      c.totalVolumeFt3,
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
    surfaceType: m.surfaceType,
    unit: m.unit,
    quantity: m.quantity,
    plasterThickness: m.plasterThickness,
    wastagePercent: m.wastagePercent,
    grossAreaM2: shown(c.grossAreaM2),
    openingDeductionAreaM2: shown(c.openingDeductionAreaM2),
    netAreaM2: shown(c.netAreaM2),
    netAreaFt2: shown(c.netAreaFt2),
    plasterVolumeM3: shown(c.plasterVolumeM3),
    wastageVolumeM3: shown(c.wastageVolumeM3),
    totalVolumeM3: shown(c.totalVolumeM3),
    totalVolumeFt3: shown(c.totalVolumeFt3),
    working,
  };
}
