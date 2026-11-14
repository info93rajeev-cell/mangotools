import { NORTH_WEDDING_RECIPES_1 } from './foodRecipesNorthWedding1.ts';
import { NORTH_WEDDING_RECIPES_2 } from './foodRecipesNorthWedding2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const NORTH_WEDDING_RECIPES: ExtendedFoodRecipe[] = [
  ...NORTH_WEDDING_RECIPES_1,
  ...NORTH_WEDDING_RECIPES_2,
];
