import type { FoodIngredient } from '@mangotools/schemas';
import { EXTENDED_INGREDIENTS } from './foodIngredientsExtended.ts';
import { FESTIVAL_SWEET_INGREDIENTS } from './foodIngredientsFestivalSweets.ts';
import { FOUNDATION_INGREDIENTS } from './foodIngredientsFoundation.ts';
import { GLOBAL_INGREDIENTS } from './foodIngredientsGlobal.ts';
import { GLOBAL_INGREDIENTS_2 } from './foodIngredientsGlobal2.ts';
import { INDIA_5_REGIONS_INGREDIENTS } from './foodIngredientsIndia5Regions.ts';
import { INTERNATIONAL_PARTY_INGREDIENTS } from './foodIngredientsInternationalParty.ts';
import { NON_VEG_INGREDIENTS } from './foodIngredientsNonVeg.ts';
import { NORTH_REGIONAL_INGREDIENTS } from './foodIngredientsNorthRegional.ts';
import { US_INGREDIENTS } from './foodIngredientsUS.ts';
import { VEG_PARTY_INGREDIENTS } from './foodIngredientsVegParty.ts';

export const CATALOG_INGREDIENTS: FoodIngredient[] = [
  ...FOUNDATION_INGREDIENTS,
  ...EXTENDED_INGREDIENTS,
  ...FESTIVAL_SWEET_INGREDIENTS,
  ...US_INGREDIENTS,
  ...GLOBAL_INGREDIENTS,
  ...GLOBAL_INGREDIENTS_2,
  ...NON_VEG_INGREDIENTS,
  ...VEG_PARTY_INGREDIENTS,
  ...INTERNATIONAL_PARTY_INGREDIENTS,
  ...INDIA_5_REGIONS_INGREDIENTS,
  ...NORTH_REGIONAL_INGREDIENTS,
];
