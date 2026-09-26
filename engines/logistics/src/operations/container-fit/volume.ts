import { type OpWarning, warning } from '@mangotools/core';
import { compare, div, mul, sub } from '@mangotools/engine-numeric';
import { floorCount } from '../../lib/orientation-grid.ts';
import { CM3_TO_M3 } from './units.ts';

export interface VolumeMetrics {
  cartonCbm: string;
  containerCbm: string;
  totalCbm: string;
  usableCbm: string;
  cartonsByVolume: string;
  remainingCbm: string;
  volumeFillPercent: string;
}

function volumeM3(length: string, width: string, height: string): string {
  return mul(mul(mul(length, width), height), CM3_TO_M3);
}

/** Volume estimate: carton, container and usable CBM, fill percentage and cartons by volume. */
export function computeVolumeMetrics(
  cartonCm: readonly [string, string, string],
  containerAxes: readonly [string, string, string],
  quantity: string,
  usablePercent: string,
): VolumeMetrics {
  const cartonCbm = volumeM3(cartonCm[0], cartonCm[1], cartonCm[2]);
  const containerCbm = volumeM3(containerAxes[0], containerAxes[1], containerAxes[2]);
  const totalCbm = mul(cartonCbm, quantity);
  const usableCbm = mul(containerCbm, div(usablePercent, '100', 20));
  return {
    cartonCbm,
    containerCbm,
    totalCbm,
    usableCbm,
    cartonsByVolume: floorCount(usableCbm, cartonCbm),
    remainingCbm: sub(usableCbm, totalCbm),
    volumeFillPercent: mul(div(totalCbm, usableCbm, 20), '100'),
  };
}

/**
 * How much of the usable volume the simple grid actually occupies: (cartons in the grid × carton
 * volume) ÷ usable volume × 100. The grid ignores `usablePercent` (it is a physical count against the
 * full container), so this can exceed 100% when the grid outperforms the usable-volume estimate.
 */
export function gridUtilization(gridTotal: string, cartonCbm: string, usableCbm: string): string {
  return mul(div(mul(gridTotal, cartonCbm), usableCbm, 20), '100');
}

/** The three standing notices, always shown, plus over-capacity warnings when they apply. */
export function collectWarnings(
  volume: VolumeMetrics,
  quantity: string,
  gridTotal: string,
): OpWarning[] {
  const warnings: OpWarning[] = [
    warning('LOGISTICS_CONTAINER_VOLUME_NOT_GUARANTEED'),
    warning('LOGISTICS_CONTAINER_GRID_NOT_ADVANCED_PLANNING'),
    warning('LOGISTICS_CONTAINER_VERIFY_PROFESSIONAL'),
  ];
  if (compare(volume.totalCbm, volume.usableCbm) > 0) {
    warnings.push(warning('LOGISTICS_CONTAINER_OVER_CAPACITY_VOLUME'));
  }
  if (compare(quantity, gridTotal) > 0) {
    warnings.push(warning('LOGISTICS_CONTAINER_OVER_CAPACITY_GRID'));
  }
  return warnings;
}
