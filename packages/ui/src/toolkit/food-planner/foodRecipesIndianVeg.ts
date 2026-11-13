import { INDIAN_VEG_BREADS } from './foodRecipesIndianVegBreads.ts';
import { INDIAN_VEG_CURRIES_1 } from './foodRecipesIndianVegCurries1.ts';
import { INDIAN_VEG_CURRIES_2 } from './foodRecipesIndianVegCurries2.ts';
import { INDIAN_VEG_DRINKS } from './foodRecipesIndianVegDrinks.ts';
import { INDIAN_VEG_RICE } from './foodRecipesIndianVegRice.ts';
import { INDIAN_VEG_SIDES_1 } from './foodRecipesIndianVegSides1.ts';
import { INDIAN_VEG_SIDES_2 } from './foodRecipesIndianVegSides2.ts';
import { INDIAN_VEG_SWEETS } from './foodRecipesIndianVegSweets.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const INDIAN_VEG_PARTY_RECIPES: ExtendedFoodRecipe[] = [
  ...INDIAN_VEG_CURRIES_1,
  ...INDIAN_VEG_CURRIES_2,
  ...INDIAN_VEG_RICE,
  ...INDIAN_VEG_BREADS,
  ...INDIAN_VEG_SIDES_1,
  ...INDIAN_VEG_SIDES_2,
  ...INDIAN_VEG_SWEETS,
  ...INDIAN_VEG_DRINKS,
];
