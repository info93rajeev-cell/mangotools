import type { IngredientInput, RecipeInput, ShoppingParams } from './schema.ts';

/** Ingredients of a recipe that are not suitable for the requested diet (never silently removed). */
export function dietConflicts(
  recipe: RecipeInput,
  ingredients: Map<string, IngredientInput>,
  diet: ShoppingParams['diet'],
): string[] {
  if (diet === 'none') return [];
  const found: string[] = [];
  for (const line of recipe.ingredients) {
    const notFor = ingredients.get(line.ingredient)?.notFor ?? [];
    if (notFor.includes(diet) && !found.includes(line.ingredient)) found.push(line.ingredient);
  }
  return found;
}

const RANK = { vegan: 0, vegetarian: 1, eggetarian: 2, 'non-vegetarian': 3 } as const;
type MenuDiet = keyof typeof RANK;

/** The least restrictive diet among the included recipes decides what the whole selection is. */
export function commonDiet(recipes: RecipeInput[]): MenuDiet {
  let worst: MenuDiet = 'vegan';
  for (const recipe of recipes) {
    const diet: MenuDiet = recipe.diet === 'jain' ? 'vegetarian' : recipe.diet;
    if (RANK[diet] > RANK[worst]) worst = diet;
  }
  return worst;
}
