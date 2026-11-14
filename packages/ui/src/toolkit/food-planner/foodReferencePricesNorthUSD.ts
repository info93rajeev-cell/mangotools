import { NORTH_REGIONAL_PRICES_USD_1 } from './foodReferencePricesNorthUSD1.ts';
import { NORTH_REGIONAL_PRICES_USD_2 } from './foodReferencePricesNorthUSD2.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export const NORTH_REGIONAL_PRICES_USD: FoodPriceItemUS[] = [
  ...NORTH_REGIONAL_PRICES_USD_1,
  ...NORTH_REGIONAL_PRICES_USD_2,
];
