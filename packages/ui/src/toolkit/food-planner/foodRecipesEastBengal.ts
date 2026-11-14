import { EAST_BENGAL_RECIPES_1 } from './foodRecipesEastBengal1.ts';
import { EAST_BENGAL_RECIPES_2 } from './foodRecipesEastBengal2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const EAST_BENGAL_RECIPES: ExtendedFoodRecipe[] = [
  ...EAST_BENGAL_RECIPES_1,
  ...EAST_BENGAL_RECIPES_2,
];
