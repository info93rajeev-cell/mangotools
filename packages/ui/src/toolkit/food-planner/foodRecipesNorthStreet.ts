import { NORTH_STREET_RECIPES_1 } from './foodRecipesNorthStreet1.ts';
import { NORTH_STREET_RECIPES_2 } from './foodRecipesNorthStreet2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const NORTH_STREET_RECIPES: ExtendedFoodRecipe[] = [
  ...NORTH_STREET_RECIPES_1,
  ...NORTH_STREET_RECIPES_2,
];
