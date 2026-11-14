import { CENTRAL_BHOPAL_RECIPES_1 } from './foodRecipesCentralBhopal1.ts';
import { CENTRAL_BHOPAL_RECIPES_2 } from './foodRecipesCentralBhopal2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const CENTRAL_BHOPAL_RECIPES: ExtendedFoodRecipe[] = [
  ...CENTRAL_BHOPAL_RECIPES_1,
  ...CENTRAL_BHOPAL_RECIPES_2,
];
