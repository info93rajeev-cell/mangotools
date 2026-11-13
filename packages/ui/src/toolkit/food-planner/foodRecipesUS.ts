import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';
import { US_DESSERTS_RECIPES } from './foodRecipesUSDesserts.ts';
import { US_MAINS_RECIPES } from './foodRecipesUSMains.ts';
import { US_SIDES_RECIPES } from './foodRecipesUSSides.ts';
import { US_SOUPS_AND_SANDWICHES_RECIPES } from './foodRecipesUSSoupsAndSandwiches.ts';

export const US_RECIPES: ExtendedFoodRecipe[] = [
  ...US_MAINS_RECIPES,
  ...US_SOUPS_AND_SANDWICHES_RECIPES,
  ...US_SIDES_RECIPES,
  ...US_DESSERTS_RECIPES,
];
