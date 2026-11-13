import { EUROPE_RECIPES_1 } from './foodRecipesEurope1.ts';
import { EUROPE_RECIPES_2 } from './foodRecipesEurope2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const EUROPE_RECIPES: ExtendedFoodRecipe[] = [...EUROPE_RECIPES_1, ...EUROPE_RECIPES_2];
