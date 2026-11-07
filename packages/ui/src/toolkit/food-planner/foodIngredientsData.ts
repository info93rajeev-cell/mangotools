import type { FoodIngredient } from '@mangotools/schemas';
import { EXTENDED_INGREDIENTS } from './foodIngredientsExtended.ts';
import { FOUNDATION_INGREDIENTS } from './foodIngredientsFoundation.ts';

export const CATALOG_INGREDIENTS: FoodIngredient[] = [
  ...FOUNDATION_INGREDIENTS,
  ...EXTENDED_INGREDIENTS,
];
