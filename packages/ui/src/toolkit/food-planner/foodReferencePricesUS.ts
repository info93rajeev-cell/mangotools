import { GLOBAL_PRICES_USD } from './foodReferencePricesGlobal.ts';
import { REFERENCE_PRICES_US_PART1 } from './foodReferencePricesUS1.ts';
import { REFERENCE_PRICES_US_PART2 } from './foodReferencePricesUS2.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

function dedupe(prices: FoodPriceItemUS[]): FoodPriceItemUS[] {
  const seen = new Set<string>();
  const out: FoodPriceItemUS[] = [];
  for (const p of prices) {
    const key = `${p.ingredient}::${p.kind}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

export const REFERENCE_PRICES_US: FoodPriceItemUS[] = dedupe([
  ...REFERENCE_PRICES_US_PART1,
  ...REFERENCE_PRICES_US_PART2,
  ...GLOBAL_PRICES_USD,
]);
