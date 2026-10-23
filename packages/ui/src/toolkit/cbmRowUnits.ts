import { convertUnitText } from '../format/units.ts';
import type { CbmPackage } from './cbmShipmentModel.ts';

/** Re-expresses a row's weight per package in another weight unit (exact decimal conversion). */
export function withWeightUnit<T extends Pick<CbmPackage, 'weightPerItem' | 'weightUnit'>>(
  row: T,
  weightUnit: string,
): T {
  if (row.weightUnit === weightUnit) return row;
  return {
    ...row,
    weightUnit,
    weightPerItem: convertUnitText(row.weightPerItem, 'weight', row.weightUnit, weightUnit),
  };
}

/** Moves one item to a new position, keeping every other item in order. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const last = items.length - 1;
  if (from < 0 || from > last || to < 0 || to > last || from === to) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
