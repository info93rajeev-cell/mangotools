import { MIDDLE_EAST_RECIPES_1 } from './foodRecipesMiddleEast1.ts';
import { MIDDLE_EAST_RECIPES_2 } from './foodRecipesMiddleEast2.ts';
import { MIDDLE_EAST_RECIPES_3 } from './foodRecipesMiddleEast3.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const MIDDLE_EAST_RECIPES: ExtendedFoodRecipe[] = [
  ...MIDDLE_EAST_RECIPES_1,
  ...MIDDLE_EAST_RECIPES_2,
  ...MIDDLE_EAST_RECIPES_3,
];
