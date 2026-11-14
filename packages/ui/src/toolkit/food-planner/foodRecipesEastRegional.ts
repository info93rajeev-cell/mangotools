import { EAST_REGIONAL_RECIPES_1 } from './foodRecipesEastRegional1.ts';
import { EAST_REGIONAL_RECIPES_2 } from './foodRecipesEastRegional2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const EAST_REGIONAL_RECIPES: ExtendedFoodRecipe[] = [
  ...EAST_REGIONAL_RECIPES_1,
  ...EAST_REGIONAL_RECIPES_2,
];
