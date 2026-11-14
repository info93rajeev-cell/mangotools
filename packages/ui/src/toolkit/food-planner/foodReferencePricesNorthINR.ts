import type { FoodPriceItem } from './foodReferencePrices.ts';
import { NORTH_REGIONAL_PRICES_INR_1 } from './foodReferencePricesNorthINR1.ts';
import { NORTH_REGIONAL_PRICES_INR_2 } from './foodReferencePricesNorthINR2.ts';

export const NORTH_REGIONAL_PRICES_INR: FoodPriceItem[] = [
  ...NORTH_REGIONAL_PRICES_INR_1,
  ...NORTH_REGIONAL_PRICES_INR_2,
];
