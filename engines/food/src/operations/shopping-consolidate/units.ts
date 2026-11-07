import { type Fraction, fraction } from '../../exact-quantity.ts';

type Dimension = 'mass' | 'volume' | 'count';

/** Metric kitchen measures (1 tsp = 5 ml, 1 tbsp = 15 ml, 1 cup = 250 ml). No cross-dimension conversion. */
export const UNITS: Readonly<Record<string, { dimension: Dimension; toBase: Fraction }>> = {
  g: { dimension: 'mass', toBase: fraction(1n) },
  kg: { dimension: 'mass', toBase: fraction(1000n) },
  ml: { dimension: 'volume', toBase: fraction(1n) },
  l: { dimension: 'volume', toBase: fraction(1000n) },
  tsp: { dimension: 'volume', toBase: fraction(5n) },
  tbsp: { dimension: 'volume', toBase: fraction(15n) },
  cup: { dimension: 'volume', toBase: fraction(250n) },
  piece: { dimension: 'count', toBase: fraction(1n) },
};

export const BASE_UNIT: Readonly<Record<Dimension, 'g' | 'ml' | 'piece'>> = {
  mass: 'g',
  volume: 'ml',
  count: 'piece',
};

export function unitOf(unit: string): { dimension: Dimension; toBase: Fraction } | undefined {
  return Object.hasOwn(UNITS, unit) ? UNITS[unit] : undefined;
}
