import { type OpWarning, warning } from '@mangotools/core';
import { add, compare, div, mul, sub } from '@mangotools/engine-numeric';
import {
  type Dim,
  floorCount,
  ORIENTATIONS,
  type OrientationResult,
} from '../../lib/orientation-grid.ts';

export interface PalletStats {
  cartonsPerLayer: string;
  layers: string;
  cartonsPerPallet: string;
  palletsRequired: string;
  cartonsOnLastPallet: string;
  usedAreaPercent: string;
  unusedAreaPercent: string;
  estimatedStackHeight: string;
}

/** Whole pallets needed for the quantity: ceil(quantity / cartonsPerPallet). */
function ceilDiv(quantity: string, cartonsPerPallet: string): string {
  const whole = floorCount(quantity, cartonsPerPallet);
  const remainder = sub(quantity, mul(whole, cartonsPerPallet));
  return compare(remainder, '0') > 0 ? add(whole, '1') : whole;
}

/** Cartons on the final pallet: the remainder, or a full pallet when the quantity divides exactly. */
function lastPalletCartons(quantity: string, cartonsPerPallet: string): string {
  const whole = floorCount(quantity, cartonsPerPallet);
  const remainder = sub(quantity, mul(whole, cartonsPerPallet));
  return compare(remainder, '0') > 0 ? remainder : cartonsPerPallet;
}

/** Footprint, layer, pallet-count and area stats derived from the winning orientation. */
export function computePalletStats(
  grid: OrientationResult,
  cartonCm: Record<Dim, string>,
  palletAxes: readonly [string, string, string],
  leftover: readonly [string, string, string],
  quantity: string,
): PalletStats {
  const cartonsPerLayer = mul(grid.counts[0], grid.counts[1]);
  const cartonsPerPallet = grid.total;
  const order = ORIENTATIONS[grid.key];
  const footprintPerCarton = mul(cartonCm[order[0]], cartonCm[order[1]]);
  const palletFootprint = mul(palletAxes[0], palletAxes[1]);
  const usedAreaPercent = mul(
    div(mul(footprintPerCarton, cartonsPerLayer), palletFootprint, 20),
    '100',
  );
  return {
    cartonsPerLayer,
    layers: grid.counts[2],
    cartonsPerPallet,
    palletsRequired: ceilDiv(quantity, cartonsPerPallet),
    cartonsOnLastPallet: lastPalletCartons(quantity, cartonsPerPallet),
    usedAreaPercent,
    unusedAreaPercent: sub('100', usedAreaPercent),
    estimatedStackHeight: sub(palletAxes[2], leftover[2]),
  };
}

/** The three standing notices, always shown, plus the multiple-pallets notice when it applies. */
export function collectWarnings(palletsRequired: string): OpWarning[] {
  const warnings: OpWarning[] = [
    warning('LOGISTICS_PALLET_NOT_LOAD_SAFETY'),
    warning('LOGISTICS_PALLET_VERIFY_BEFORE_SHIPMENT'),
    warning('LOGISTICS_PALLET_DIMENSIONS_VARY'),
  ];
  if (compare(palletsRequired, '1') > 0) {
    warnings.push(warning('LOGISTICS_PALLET_MULTIPLE_PALLETS_REQUIRED'));
  }
  return warnings;
}
