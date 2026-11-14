import { INDIAN_SOUTH_RICE_PART1 } from './foodRecipesIndianSouthRice1.ts';
import { INDIAN_SOUTH_RICE_PART2 } from './foodRecipesIndianSouthRice2.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const INDIAN_SOUTH_RICE: ExtendedFoodRecipe[] = [
  ...INDIAN_SOUTH_RICE_PART1,
  ...INDIAN_SOUTH_RICE_PART2,
];
