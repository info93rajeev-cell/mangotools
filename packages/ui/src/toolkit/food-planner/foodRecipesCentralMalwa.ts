import { CENTRAL_MALWA_RECIPES_1 } from './foodRecipesCentralMalwa1.ts';
import { CENTRAL_MALWA_RECIPES_2 } from './foodRecipesCentralMalwa2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const CENTRAL_MALWA_RECIPES: ExtendedFoodRecipe[] = [
  ...CENTRAL_MALWA_RECIPES_1,
  ...CENTRAL_MALWA_RECIPES_2,
];
