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
      'grossAreaPerWall',
      'brickwork.grossAreaPerWall',
      { length: m.wallLength, height: m.wallHeight, unit: m.unit },
      c.grossAreaPerWallM2,
    ),
    step(
      'grossWallArea',
      'brickwork.grossWallArea',
      { grossAreaPerWall: c.grossAreaPerWallM2, quantity: m.quantity },
      c.grossWallAreaM2,
    ),
    step(
      'openingDeduction',
      'brickwork.openingDeduction',
      { openingArea: c.openingAreaM2, quantity: m.quantity },
      c.openingDeductionAreaM2,
    ),
    step(
      'netWallArea',
      'brickwork.netWallArea',
      { grossWallArea: c.grossWallAreaM2, openingDeduction: c.openingDeductionAreaM2 },
      c.netWallAreaM2,
    ),
    step(
      'brickworkVolume',
      'brickwork.volume',
      { netWallArea: c.netWallAreaM2, thickness: c.wallThicknessM },
      c.brickworkVolumeM3,
    ),
    step(
      'effectiveBrickVolume',
      'brickwork.brickVolume',
      {
        brickLength: m.brickLength,
        brickWidth: m.brickWidth,
        brickHeight: m.brickHeight,
        brickUnit: m.brickUnit,
        mortarJointMm: m.mortarJointMm,
      },
      c.effectiveBrickVolumeM3,
    ),
    step(
      'estimatedBrickCount',
      'brickwork.brickCount',
      { brickworkVolume: c.brickworkVolumeM3, effectiveBrickVolume: c.effectiveBrickVolumeM3 },
      c.estimatedBrickCount,
    ),
    step(
      'wastageBricks',
      'brickwork.wastageBricks',
      { estimatedBrickCount: c.estimatedBrickCount, wastagePercent: m.wastagePercent },
      c.wastageBricks,
    ),
    step(
      'totalBricks',
      'brickwork.totalBricks',
      { estimatedBrickCount: c.estimatedBrickCount, wastageBricks: c.wastageBricks },
      c.totalBricks,
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
    brickUnit: m.brickUnit,
    quantity: m.quantity,
    wastagePercent: m.wastagePercent,
    mortarJointMm: m.mortarJointMm,
    grossWallAreaM2: shown(c.grossWallAreaM2),
    openingDeductionAreaM2: shown(c.openingDeductionAreaM2),
    netWallAreaM2: shown(c.netWallAreaM2),
    netWallAreaFt2: shown(c.netWallAreaFt2),
    brickworkVolumeM3: shown(c.brickworkVolumeM3),
    brickworkVolumeFt3: shown(c.brickworkVolumeFt3),
    effectiveBrickVolumeM3: shown(c.effectiveBrickVolumeM3),
    estimatedBrickCount: shown(c.estimatedBrickCount),
    wastageBricks: shown(c.wastageBricks),
    totalBricks: shown(c.totalBricks),
    working,
  };
}
