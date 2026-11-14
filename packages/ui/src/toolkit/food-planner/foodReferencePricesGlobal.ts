import type { FoodPriceItem } from './foodReferencePrices.ts';
import {
  GLOBAL_PRICES_INR as GLOBAL_PRICES_INR_PART1,
  GLOBAL_PRICES_USD_PART1,
} from './foodReferencePricesGlobal1.ts';
import { GLOBAL_PRICES_USD_PART2 } from './foodReferencePricesGlobal2.ts';
import { GLOBAL_PRICES_USD_PART3 } from './foodReferencePricesGlobal3.ts';
import { GLOBAL_PRICES_INR_PART4 } from './foodReferencePricesGlobal4.ts';
import { GLOBAL_PRICES_USD_PART4 } from './foodReferencePricesGlobal5.ts';
import { INDIA_5_REGIONS_PRICES_INR } from './foodReferencePricesIndia5RegionsINR.ts';
import { INDIA_5_REGIONS_PRICES_USD } from './foodReferencePricesIndia5RegionsUSD.ts';
import { INTERNATIONAL_PRICES_INR } from './foodReferencePricesInternationalINR.ts';
import { INTERNATIONAL_PRICES_USD } from './foodReferencePricesInternationalUSD.ts';
import { NON_VEG_PRICES_INR } from './foodReferencePricesNonVegINR.ts';
import { NON_VEG_PRICES_USD } from './foodReferencePricesNonVegUSD.ts';
import { NORTH_REGIONAL_PRICES_INR } from './foodReferencePricesNorthINR.ts';
import { NORTH_REGIONAL_PRICES_USD } from './foodReferencePricesNorthUSD.ts';
import type { FoodPriceItemUS } from './foodReferencePricesUSTypes.ts';
import { VEG_PARTY_PRICES_INR } from './foodReferencePricesVegPartyINR.ts';
import { VEG_PARTY_PRICES_USD } from './foodReferencePricesVegPartyUSD.ts';

export const GLOBAL_PRICES_INR: FoodPriceItem[] = [
  ...GLOBAL_PRICES_INR_PART1,
  ...GLOBAL_PRICES_INR_PART4,
  ...NON_VEG_PRICES_INR,
  ...VEG_PARTY_PRICES_INR,
  ...INTERNATIONAL_PRICES_INR,
  ...INDIA_5_REGIONS_PRICES_INR,
  ...NORTH_REGIONAL_PRICES_INR,
];

export const GLOBAL_PRICES_USD: FoodPriceItemUS[] = [
  ...GLOBAL_PRICES_USD_PART1,
  ...GLOBAL_PRICES_USD_PART2,
  ...GLOBAL_PRICES_USD_PART3,
  ...GLOBAL_PRICES_USD_PART4,
  ...NON_VEG_PRICES_USD,
  ...VEG_PARTY_PRICES_USD,
  ...INTERNATIONAL_PRICES_USD,
  ...INDIA_5_REGIONS_PRICES_USD,
  ...NORTH_REGIONAL_PRICES_USD,
];
