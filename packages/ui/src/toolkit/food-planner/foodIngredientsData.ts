import type { FoodIngredient } from '@mangotools/schemas';
import { EXTENDED_INGREDIENTS } from './foodIngredientsExtended.ts';
import { FESTIVAL_SWEET_INGREDIENTS } from './foodIngredientsFestivalSweets.ts';
import { FOUNDATION_INGREDIENTS } from './foodIngredientsFoundation.ts';
import { GLOBAL_INGREDIENTS } from './foodIngredientsGlobal.ts';
import { US_INGREDIENTS } from './foodIngredientsUS.ts';

export const CATALOG_INGREDIENTS: FoodIngredient[] = [
  ...FOUNDATION_INGREDIENTS,
  ...EXTENDED_INGREDIENTS,
  ...FESTIVAL_SWEET_INGREDIENTS,
  ...US_INGREDIENTS,
  ...GLOBAL_INGREDIENTS,
];
