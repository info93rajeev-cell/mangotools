import { GLOBAL_PRICES_INR, GLOBAL_PRICES_USD_PART1 } from './foodReferencePricesGlobal1.ts';
import { GLOBAL_PRICES_USD_PART2 } from './foodReferencePricesGlobal2.ts';
import { GLOBAL_PRICES_USD_PART3 } from './foodReferencePricesGlobal3.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export { GLOBAL_PRICES_INR };

export const GLOBAL_PRICES_USD: FoodPriceItemUS[] = [
  ...GLOBAL_PRICES_USD_PART1,
  ...GLOBAL_PRICES_USD_PART2,
  ...GLOBAL_PRICES_USD_PART3,
];
