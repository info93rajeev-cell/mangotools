import { INDIAN_NON_VEG_RECIPES_1 } from './foodRecipesIndianNonVeg1.ts';
import { INDIAN_NON_VEG_RECIPES_2 } from './foodRecipesIndianNonVeg2.ts';
import { INDIAN_NON_VEG_RECIPES_3 } from './foodRecipesIndianNonVeg3.ts';
import { INDIAN_NON_VEG_RECIPES_4 } from './foodRecipesIndianNonVeg4.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const INDIAN_NON_VEG_RECIPES: ExtendedFoodRecipe[] = [
  ...INDIAN_NON_VEG_RECIPES_1,
  ...INDIAN_NON_VEG_RECIPES_2,
  ...INDIAN_NON_VEG_RECIPES_3,
  ...INDIAN_NON_VEG_RECIPES_4,
];
