import type { FoodPriceItem } from './foodReferencePrices.ts';
import { INDIA_5_REGIONS_PRICES_INR_1 } from './foodReferencePricesIndia5RegionsINR1.ts';
import { INDIA_5_REGIONS_PRICES_INR_2 } from './foodReferencePricesIndia5RegionsINR2.ts';

export const INDIA_5_REGIONS_PRICES_INR: FoodPriceItem[] = [
  ...INDIA_5_REGIONS_PRICES_INR_1,
  ...INDIA_5_REGIONS_PRICES_INR_2,
];
