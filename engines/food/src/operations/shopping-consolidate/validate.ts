import type { DetailValue } from '@mangotools/core';
import { type Fraction, parseQuantity } from '../../exact-quantity.ts';
import type { IngredientInput, RecipeInput, ShoppingInput } from './schema.ts';
import { unitOf } from './units.ts';

export interface Failure {
  code: string;
  path: string;
  details: Record<string, DetailValue>;
}

export interface Selected {
  recipe: RecipeInput;
  portion: Fraction;
}

export interface Checked {
  ingredients: Map<string, IngredientInput>;
  selected: Selected[];
  servingsPerGuest: Fraction;
}

function indexIngredients(list: IngredientInput[]): Map<string, IngredientInput> | Failure {
  const map = new Map<string, IngredientInput>();
  for (const item of list) {
    if (map.has(item.id)) {
      return {
        code: 'FOOD_DUPLICATE_INGREDIENT',
        path: 'ingredients',
        details: { ingredient: item.id },
      };
    }
    map.set(item.id, item);
  }
  return map;
}

function indexRecipes(list: RecipeInput[]): Map<string, RecipeInput> | Failure {
  const map = new Map<string, RecipeInput>();
  for (const recipe of list) {
    const key = `${recipe.id}@${recipe.version}`;
    if (map.has(key)) {
      return {
        code: 'FOOD_DUPLICATE_RECIPE',
        path: 'recipes',
        details: { recipe: recipe.id, version: recipe.version },
      };
    }
    map.set(key, recipe);
  }
  return map;
}

/** Every line must name a known ingredient, a known unit of that ingredient's dimension and a plain amount. */
function checkLines(
  recipe: RecipeInput,
  ingredients: Map<string, IngredientInput>,
): Failure | null {
  for (const line of recipe.ingredients) {
    const base = { recipe: recipe.id, ingredient: line.ingredient };
    const ingredient = ingredients.get(line.ingredient);
    if (!ingredient) return { code: 'FOOD_UNKNOWN_INGREDIENT', path: 'recipes', details: base };
    const unit = unitOf(line.unit);
    if (!unit)
      return { code: 'FOOD_UNKNOWN_UNIT', path: 'recipes', details: { ...base, unit: line.unit } };
    if (unit.dimension !== ingredient.dimension) {
      return {
        code: 'FOOD_DIMENSION_MISMATCH',
        path: 'recipes',
        details: { ...base, unit: line.unit, dimension: ingredient.dimension },
      };
    }
    if (!parseQuantity(line.quantity)) {
      return { code: 'FOOD_INVALID_QUANTITY', path: 'recipes', details: { value: line.quantity } };
    }
  }
  return null;
}

function select(input: ShoppingInput, recipes: Map<string, RecipeInput>): Selected[] | Failure {
  const seen = new Set<string>();
  const selected: Selected[] = [];
  for (const item of input.selection) {
    if (seen.has(item.recipe)) {
      return {
        code: 'FOOD_DUPLICATE_SELECTION',
        path: 'selection',
        details: { recipe: item.recipe },
      };
    }
    seen.add(item.recipe);
    const recipe = recipes.get(`${item.recipe}@${item.recipeVersion}`);
    if (!recipe) {
      return {
        code: 'FOOD_UNKNOWN_RECIPE',
        path: 'selection',
        details: { recipe: item.recipe, version: item.recipeVersion },
      };
    }
    const portion = parseQuantity(item.portionFactor ?? '1');
    if (!portion || portion.n === 0n) {
      return {
        code: 'FOOD_INVALID_QUANTITY',
        path: 'selection',
        details: { value: item.portionFactor ?? '' },
      };
    }
    selected.push({ recipe, portion });
  }
  return selected;
}

const isFailure = (value: unknown): value is Failure =>
  typeof value === 'object' && value !== null && 'code' in value;

/** Validates the whole input before any arithmetic; the first problem is returned. */
export function checkInput(input: ShoppingInput): Checked | Failure {
  const ingredients = indexIngredients(input.ingredients);
  if (isFailure(ingredients)) return ingredients;
  const recipes = indexRecipes(input.recipes);
  if (isFailure(recipes)) return recipes;
  for (const recipe of recipes.values()) {
    const failure = checkLines(recipe, ingredients);
    if (failure) return failure;
  }
  const selected = select(input, recipes);
  if (isFailure(selected)) return selected;
  const servingsPerGuest = parseQuantity(input.servingsPerGuest);
  if (!servingsPerGuest || servingsPerGuest.n === 0n) {
    return {
      code: 'FOOD_INVALID_QUANTITY',
      path: 'servingsPerGuest',
      details: { value: input.servingsPerGuest },
    };
  }
  return { ingredients, selected, servingsPerGuest };
}

export { isFailure };
