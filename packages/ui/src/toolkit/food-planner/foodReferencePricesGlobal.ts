import type { FoodPriceItem } from './foodReferencePrices.ts';
import {
  GLOBAL_PRICES_INR as GLOBAL_PRICES_INR_PART1,
  GLOBAL_PRICES_USD_PART1,
} from './foodReferencePricesGlobal1.ts';
import { GLOBAL_PRICES_USD_PART2 } from './foodReferencePricesGlobal2.ts';
import { GLOBAL_PRICES_USD_PART3 } from './foodReferencePricesGlobal3.ts';
import { GLOBAL_PRICES_INR_PART4 } from './foodReferencePricesGlobal4.ts';
import { GLOBAL_PRICES_USD_PART4 } from './foodReferencePricesGlobal5.ts';
import { NON_VEG_PRICES_INR } from './foodReferencePricesNonVegINR.ts';
import { NON_VEG_PRICES_USD } from './foodReferencePricesNonVegUSD.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';

export const GLOBAL_PRICES_INR: FoodPriceItem[] = [
  ...GLOBAL_PRICES_INR_PART1,
  ...GLOBAL_PRICES_INR_PART4,
  ...NON_VEG_PRICES_INR,
];

export const GLOBAL_PRICES_USD: FoodPriceItemUS[] = [
  ...GLOBAL_PRICES_USD_PART1,
  ...GLOBAL_PRICES_USD_PART2,
  ...GLOBAL_PRICES_USD_PART3,
  ...GLOBAL_PRICES_USD_PART4,
  ...NON_VEG_PRICES_USD,
];
