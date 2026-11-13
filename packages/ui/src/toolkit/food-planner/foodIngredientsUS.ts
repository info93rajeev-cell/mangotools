import type { FoodIngredient } from '@mangotools/schemas';
import { US_INGREDIENTS_PART1 } from './foodIngredientsUS1.ts';
import { US_INGREDIENTS_PART2 } from './foodIngredientsUS2.ts';

export const US_INGREDIENTS: FoodIngredient[] = [...US_INGREDIENTS_PART1, ...US_INGREDIENTS_PART2];
