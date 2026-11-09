import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { toDecimal } from '../../exact-quantity.ts';
import { allergensOf, scaleFactor, sumLines, toLines } from './consolidate.ts';
import { commonDiet, dietConflicts } from './diet.ts';
import {
  type ShoppingOutput,
  type ShoppingParams,
  shoppingConsolidateInput,
  shoppingConsolidateOutput,
  shoppingConsolidateParams,
} from './schema.ts';
import { type Checked, checkInput, isFailure } from './validate.ts';

function describeRecipes(checked: Checked, params: ShoppingParams) {
  return checked.selected.map((item) => {
    const conflicts = dietConflicts(item.recipe, checked.ingredients, params.diet);
    const included = !(params.dietPolicy === 'exclude-recipes' && conflicts.length > 0);
    return {
      item,
      summary: {
        recipe: item.recipe.id,
        version: item.recipe.version,
        verification: item.recipe.verification?.status ?? 'unknown',
        included,
        allergens: allergensOf(item, checked.ingredients),
        dietConflicts: conflicts,
      },
    };
  });
}

function dietWarnings(recipes: ShoppingOutput['recipes'], params: ShoppingParams): OpWarning[] {
  const conflicting = recipes.filter((r) => r.dietConflicts.length > 0).length;
  if (conflicting === 0) return [];
  const excluded = recipes.filter((r) => !r.included).length;
  return excluded > 0
    ? [
        warning('FOOD_RECIPES_EXCLUDED_FOR_DIET', {
          details: { count: excluded, diet: params.diet },
        }),
      ]
    : [warning('FOOD_DIET_CONFLICT', { details: { count: conflicting, diet: params.diet } })];
}

export const shoppingConsolidate = defineOperation({
  id: 'food.shopping.consolidate',
  major: 1,
  title: 'Consolidate a shopping list',
  summary:
    'Scales the selected recipes to the guest count and adds identical ingredients into one shopping list.',
  input: shoppingConsolidateInput,
  params: shoppingConsolidateParams,
  output: shoppingConsolidateOutput,
  errors: [
    'FOOD_DUPLICATE_INGREDIENT',
    'FOOD_DUPLICATE_RECIPE',
    'FOOD_DUPLICATE_SELECTION',
    'FOOD_UNKNOWN_RECIPE',
    'FOOD_UNKNOWN_INGREDIENT',
    'FOOD_UNKNOWN_UNIT',
    'FOOD_DIMENSION_MISMATCH',
    'FOOD_INVALID_QUANTITY',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const checked = checkInput(input);
    if (isFailure(checked))
      return err(checked.code, { path: checked.path, details: checked.details });
    const described = describeRecipes(checked, params);
    const included = described.filter((d) => d.summary.included).map((d) => d.item);
    const rounded: string[] = [];
    const scaled = included.map((item) => ({
      item,
      factor: scaleFactor(input.guests, checked.servingsPerGuest, item),
    }));
    const scale = scaled.map(({ item, factor }) => {
      const value = toDecimal(factor);
      if (!value.exact) rounded.push(`scale:${item.recipe.id}`);
      return { recipe: item.recipe.id, factor: value.text };
    });
    const lines = toLines(sumLines(scaled), checked.ingredients, rounded);
    const recipes = described.map((d) => d.summary);
    const allergens = [
      ...new Set(recipes.filter((r) => r.included).flatMap((r) => r.allergens)),
    ].sort();
    const warnings = dietWarnings(recipes, params);
    if (rounded.length > 0)
      warnings.push(warning('FOOD_VALUES_ROUNDED', { details: { count: rounded.length } }));
    const diet = commonDiet(included.map((i) => i.recipe));
    return ok({ scale, lines, allergens, diet, recipes, rounded }, warnings);
  },
});
