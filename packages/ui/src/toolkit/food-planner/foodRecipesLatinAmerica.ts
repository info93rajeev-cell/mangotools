import { LATIN_AMERICA_RECIPES_1 } from './foodRecipesLatinAmerica1.ts';
import { LATIN_AMERICA_RECIPES_2 } from './foodRecipesLatinAmerica2.ts';
import { LATIN_AMERICA_RECIPES_3 } from './foodRecipesLatinAmerica3.ts';
import { LATIN_AMERICA_RECIPES_4 } from './foodRecipesLatinAmerica4.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const LATIN_AMERICA_RECIPES: ExtendedFoodRecipe[] = [
  ...LATIN_AMERICA_RECIPES_1,
  ...LATIN_AMERICA_RECIPES_2,
  ...LATIN_AMERICA_RECIPES_3,
  ...LATIN_AMERICA_RECIPES_4,
];
