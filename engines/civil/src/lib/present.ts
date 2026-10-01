import { add, toFixedString } from '@mangotools/engine-numeric';

/**
 * Output formatting for the civil `@2` operations. Engines keep full precision internally; each
 * output is formatted once, here, by what it represents — never with one global precision.
 */

/** Areas (m², ft²): 2 decimal places. */
export const area = (value: string): string => toFixedString(value, 2, 'half-up');
/** Volumes in m³: 3 decimal places. */
export const volume = (value: string): string => toFixedString(value, 3, 'half-up');
/** Volumes in ft³/yd³, litres and gallons: 2 decimal places. */
export const amount = (value: string): string => toFixedString(value, 2, 'half-up');
/** A calculated (not purchasable) piece count, such as base bricks before wastage: 2 decimals. */
export const calculated = (value: string): string => toFixedString(value, 2, 'half-up');

/**
 * Smallest whole number ≥ a non-negative exact value: the purchase quantity of a discrete item
 * (bricks, tiles, bags, boxes, containers, truck loads). "12" → "12", "12.0001" → "13".
 */
export function ceilWhole(value: string): string {
  const [whole = '0', fraction = ''] = value.split('.');
  return /[1-9]/.test(fraction) ? add(whole, '1') : add(whole, '0');
}
