import { LATIN_AMERICA_RECIPES_1 } from './foodRecipesLatinAmerica1.ts';
import { LATIN_AMERICA_RECIPES_2 } from './foodRecipesLatinAmerica2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const LATIN_AMERICA_RECIPES: ExtendedFoodRecipe[] = [
  ...LATIN_AMERICA_RECIPES_1,
  ...LATIN_AMERICA_RECIPES_2,
];
