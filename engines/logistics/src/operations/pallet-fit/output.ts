import type { WorkingStep } from '@mangotools/core';
import type { OrientationResult } from '../../lib/orientation-grid.ts';
import type { PalletStats } from './stats.ts';
import type { Measured } from './types.ts';

const step = (
  ref: string,
  formulaKey: string,
  variables: Record<string, string>,
  result: string,
): WorkingStep => ({ ref, formulaKey, variables, result });

/** Working steps with full-precision values (templates come from the tool preset in PR 2). */
export function workingSteps(
  m: Measured,
  grid: OrientationResult,
  stats: PalletStats,
  leftover: readonly [string, string, string],
): WorkingStep[] {
  const { carton, unit, palletAxes } = m;
  return [
    step(
      'orientation',
      `pf.orientation.${grid.key}`,
      {
        length: carton.length,
        width: carton.width,
        height: carton.height,
        unit,
        alongLength: grid.counts[0],
        alongWidth: grid.counts[1],
        leftoverLength: leftover[0],
        leftoverWidth: leftover[1],
      },
      stats.cartonsPerLayer,
    ),
    step('layers', 'pf.layers', { maxStackHeight: palletAxes[2] }, stats.layers),
    step(
      'cartonsPerPallet',
      'pf.cartonsPerPallet',
      { cartonsPerLayer: stats.cartonsPerLayer, layers: stats.layers },
      stats.cartonsPerPallet,
    ),
    step(
      'palletsRequired',
      'pf.palletsRequired',
      { quantity: carton.quantity, cartonsPerPallet: stats.cartonsPerPallet },
      stats.palletsRequired,
    ),
    step(
      'cartonsOnLastPallet',
      'pf.cartonsOnLastPallet',
      { quantity: carton.quantity, cartonsPerPallet: stats.cartonsPerPallet },
      stats.cartonsOnLastPallet,
    ),
    step(
      'usedArea',
      'pf.usedArea',
      { palletLength: palletAxes[0], palletWidth: palletAxes[1] },
      stats.usedAreaPercent,
    ),
    step(
      'estimatedStackHeight',
      'pf.estimatedStackHeight',
      { maxStackHeight: palletAxes[2] },
      stats.estimatedStackHeight,
    ),
  ];
}

export function buildOutput(
  grid: OrientationResult,
  stats: PalletStats,
  leftover: readonly [string, string, string],
  quantity: string,
  shown: (value: string) => string,
  working: WorkingStep[],
) {
  return {
    bestOrientation: grid.key,
    cartonsAlongPalletLength: grid.counts[0],
    cartonsAlongPalletWidth: grid.counts[1],
    cartonsPerLayer: stats.cartonsPerLayer,
    layers: stats.layers,
    cartonsPerPallet: stats.cartonsPerPallet,
    palletsRequired: stats.palletsRequired,
    cartonsOnLastPallet: stats.cartonsOnLastPallet,
    usedAreaPercent: shown(stats.usedAreaPercent),
    unusedAreaPercent: shown(stats.unusedAreaPercent),
    estimatedStackHeight: shown(stats.estimatedStackHeight),
    leftoverPalletLength: shown(leftover[0]),
    leftoverPalletWidth: shown(leftover[1]),
    quantity,
    working,
  };
}
