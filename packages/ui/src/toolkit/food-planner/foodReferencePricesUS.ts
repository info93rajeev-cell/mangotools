import { REFERENCE_PRICES_US_PART1 } from './foodReferencePricesUS1.ts';
import { REFERENCE_PRICES_US_PART2 } from './foodReferencePricesUS2.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export const REFERENCE_PRICES_US: FoodPriceItemUS[] = [
  ...REFERENCE_PRICES_US_PART1,
  ...REFERENCE_PRICES_US_PART2,
];
