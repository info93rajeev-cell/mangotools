/**
 * food.shopping.consolidate@1 against the real FP-001 reference data. The reference data is read
 * through @mangotools/schemas (proving the engine accepts it unchanged), and golden fixture 001 in
 * reference/food/fixtures must be reproduced exactly.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestContext, executeOperation, type Result } from '@mangotools/core';
import { foodIngredientCatalogSchema, foodRecipeSchema } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { shoppingConsolidate } from '../../engines/food/src/index.ts';
import type { ShoppingOutput } from '../../engines/food/src/operations/shopping-consolidate/schema.ts';

const ROOT = join(import.meta.dirname, '../../reference/food');
const readYaml = (path: string): unknown => parse(readFileSync(path, 'utf8'));
const catalog = foodIngredientCatalogSchema.parse(readYaml(join(ROOT, 'ingredients.yaml')));
const recipes = readdirSync(join(ROOT, 'recipes'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => foodRecipeSchema.parse(readYaml(join(ROOT, 'recipes', f))));

const ALL = [
  { recipe: 'jeera-rice', recipeVersion: '0.1.0' },
  { recipe: 'dal-tadka', recipeVersion: '0.1.0' },
  { recipe: 'aloo-gobi', recipeVersion: '0.1.0' },
];

const run = (
  input: Partial<{
    selection: unknown;
    guests: number;
    servingsPerGuest: string;
    ingredients: unknown;
  }>,
  params: Record<string, unknown> = {},
) =>
  executeOperation(
    shoppingConsolidate,
    { ingredients: catalog.ingredients, recipes, selection: ALL, guests: 50, ...input },
    params,
    createTestContext(),
  ) as Promise<Result<ShoppingOutput>>;

describe('golden fixture 001 (reference/food) through the engine', () => {
  const fixture = readYaml(join(ROOT, 'fixtures/001-three-recipes-50-guests.yaml')) as {
    input: { guests: number; servingsPerGuest: string; recipes: unknown };
    expected: Record<string, unknown>;
  };

  it('reproduces every expected field exactly', async () => {
    const result = await run({
      selection: fixture.input.recipes,
      guests: fixture.input.guests,
      servingsPerGuest: fixture.input.servingsPerGuest,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const [key, value] of Object.entries(fixture.expected)) {
      expect(result.value[key as keyof typeof result.value], key).toEqual(value);
    }
    expect(result.value.rounded).toEqual([]);
  });

  it('is independent of catalogue order', async () => {
    const a = await run({});
    const b = await run({ ingredients: [...catalog.ingredients].reverse() });
    expect(a).toEqual(b);
  });
});

describe('real recipes', () => {
  it('scales to one guest exactly (factor 0.25)', async () => {
    const result = await run({ guests: 1 });
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.scale.map((s) => s.factor)).toEqual(['0.25', '0.25', '0.25']);
    const line = (id: string) => result.value.lines.find((l) => l.ingredient === id);
    expect(line('basmati-rice')).toMatchObject({ total: '50', buy: '50', unit: 'g' });
    expect(line('ghee')).toMatchObject({ total: '11.25', unit: 'ml' });
    expect(line('tomato')).toMatchObject({ total: '0.75', buy: '1' });
    expect(line('bay-leaf')).toMatchObject({ total: '0.25', buy: '1' });
  });

  it('applies per-dish portion factors and servings per guest', async () => {
    const result = await run({
      guests: 20,
      servingsPerGuest: '1.5',
      selection: [{ recipe: 'jeera-rice', recipeVersion: '0.1.0', portionFactor: '0.5' }],
    });
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.scale).toEqual([{ recipe: 'jeera-rice', factor: '3.75' }]);
    expect(result.value.lines.find((l) => l.ingredient === 'basmati-rice')?.total).toBe('750');
  });

  it('keeps each recipe verification status and allergens', async () => {
    const result = await run({});
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.recipes.map((r) => [r.recipe, r.verification, r.allergens])).toEqual([
      ['jeera-rice', 'source-checked', ['milk']],
      ['dal-tadka', 'source-checked', ['gluten-cereals', 'milk']],
      ['aloo-gobi', 'source-checked', []],
    ]);
  });
});

describe('Jain diet check on real recipes (root vegetables, onion, garlic)', () => {
  it('flags without removing anything', async () => {
    const plain = await run({});
    const flagged = await run({}, { diet: 'jain' });
    if (!plain.ok || !flagged.ok) throw new Error('run failed');
    expect(flagged.value.lines).toEqual(plain.value.lines);
    expect(flagged.value.recipes.map((r) => [r.recipe, r.included, r.dietConflicts])).toEqual([
      ['jeera-rice', true, []],
      ['dal-tadka', true, ['onion', 'garlic']],
      ['aloo-gobi', true, ['potato', 'onion', 'ginger-garlic-paste']],
    ]);
    expect(flagged.warnings.map((w) => w.code)).toEqual(['FOOD_DIET_CONFLICT']);
  });

  it('excludes whole recipes, never single ingredients', async () => {
    const result = await run({}, { diet: 'jain', dietPolicy: 'exclude-recipes' });
    if (!result.ok) throw new Error(result.error.code);
    expect(result.value.scale.map((s) => s.recipe)).toEqual(['jeera-rice']);
    expect(result.value.lines.map((l) => l.ingredient)).toEqual([
      'basmati-rice',
      'bay-leaf',
      'cumin-seeds',
      'ghee',
      'salt',
    ]);
    expect(result.value.lines.every((l) => l.usedIn.join() === 'jeera-rice')).toBe(true);
    expect(result.warnings.map((w) => w.code)).toEqual(['FOOD_RECIPES_EXCLUDED_FOR_DIET']);
  });
});

describe('rejections', () => {
  it('rejects a recipe that is not in the input, at that version', async () => {
    const result = await run({ selection: [{ recipe: 'jeera-rice', recipeVersion: '9.9.9' }] });
    expect(!result.ok && result.error.code).toBe('FOOD_UNKNOWN_RECIPE');
  });

  it('rejects selecting a recipe twice, and zero or malformed portions', async () => {
    const twice = await run({ selection: [ALL[0], ALL[0]] });
    expect(!twice.ok && twice.error.code).toBe('FOOD_DUPLICATE_SELECTION');
    for (const portionFactor of ['0', '-1', '1/2', 'abc']) {
      const bad = await run({ selection: [{ ...ALL[0], portionFactor }] });
      expect(!bad.ok && bad.error.code, portionFactor).toBe('FOOD_INVALID_QUANTITY');
    }
  });

  it('rejects a duplicated ingredient in the catalogue', async () => {
    const result = await run({ ingredients: [...catalog.ingredients, catalog.ingredients[0]] });
    expect(!result.ok && result.error.code).toBe('FOOD_DUPLICATE_INGREDIENT');
  });
});
