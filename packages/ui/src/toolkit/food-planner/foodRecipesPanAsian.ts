import { PAN_ASIAN_RECIPES_PART1 } from './foodRecipesPanAsian1.ts';
import { PAN_ASIAN_RECIPES_PART2 } from './foodRecipesPanAsian2.ts';
import { PAN_ASIAN_RECIPES_3 } from './foodRecipesPanAsian3.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const PAN_ASIAN_RECIPES: ExtendedFoodRecipe[] = [
  ...PAN_ASIAN_RECIPES_PART1,
  ...PAN_ASIAN_RECIPES_PART2,
  ...PAN_ASIAN_RECIPES_3,
];
