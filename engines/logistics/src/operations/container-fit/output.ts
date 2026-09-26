import type { WorkingStep } from '@mangotools/core';
import { compare, sub } from '@mangotools/engine-numeric';
import type { OrientationResult } from './grid.ts';
import type { Measured } from './types.ts';
import type { VolumeMetrics } from './volume.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with full-precision values (templates come from the tool preset in PR 2). */
export function workingSteps(
  m: Measured,
  volume: VolumeMetrics,
  grid: OrientationResult,
  leftover: readonly [string, string, string],
): WorkingStep[] {
  const { carton, unit, containerType, containerAxes, usablePercent } = m;
  return [
    step(
      'cartonCbm',
      'cf.cartonVolume',
      { length: carton.length, width: carton.width, height: carton.height, unit },
      volume.cartonCbm,
    ),
    step(
      'containerCbm',
      `cf.containerVolume.${containerType}`,
      { length: containerAxes[0], width: containerAxes[1], height: containerAxes[2] },
      volume.containerCbm,
    ),
    step(
      'usableCbm',
      'cf.usableVolume',
      { containerCbm: volume.containerCbm, usablePercent },
      volume.usableCbm,
    ),
    step(
      'totalCbm',
      'cf.totalVolume',
      { cartonCbm: volume.cartonCbm, quantity: carton.quantity },
      volume.totalCbm,
    ),
    step(
      'cartonsByVolume',
      'cf.cartonsByVolume',
      { usableCbm: volume.usableCbm, cartonCbm: volume.cartonCbm },
      volume.cartonsByVolume,
    ),
    step(
      'remainingCbm',
      'cf.remainingVolume',
      { usableCbm: volume.usableCbm, totalCbm: volume.totalCbm },
      volume.remainingCbm,
    ),
    step(
      'grid',
      `cf.orientation.${grid.key}`,
      {
        alongLength: grid.counts[0],
        alongWidth: grid.counts[1],
        alongHeight: grid.counts[2],
        leftoverLength: leftover[0],
        leftoverWidth: leftover[1],
        leftoverHeight: leftover[2],
      },
      grid.total,
    ),
  ];
}

export function buildOutput(
  volume: VolumeMetrics,
  grid: OrientationResult,
  leftover: readonly [string, string, string],
  quantity: string,
  shown: (value: string) => string,
  working: WorkingStep[],
) {
  const cartonsLeftAfterGrid = compare(quantity, grid.total) > 0 ? sub(quantity, grid.total) : '0';
  return {
    cartonCbm: shown(volume.cartonCbm),
    totalCbm: shown(volume.totalCbm),
    containerCbm: shown(volume.containerCbm),
    usableCbm: shown(volume.usableCbm),
    volumeFillPercent: shown(volume.volumeFillPercent),
    cartonsByVolume: volume.cartonsByVolume,
    remainingCbm: shown(volume.remainingCbm),
    bestOrientation: grid.key,
    cartonsAlongLength: grid.counts[0],
    cartonsAlongWidth: grid.counts[1],
    cartonsAlongHeight: grid.counts[2],
    maxCartonsByGrid: grid.total,
    cartonsLeftAfterGrid,
    leftoverLength: shown(leftover[0]),
    leftoverWidth: shown(leftover[1]),
    leftoverHeight: shown(leftover[2]),
    quantity,
    working,
  };
}
