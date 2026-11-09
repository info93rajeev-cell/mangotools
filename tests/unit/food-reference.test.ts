/**
 * Food Planner reference data (TASK-FP-001): every data file matches its schema, recipes only
 * use known ingredients in their own dimension, and the golden 50-guest fixture is reproduced
 * by an exact rational calculator (no floating point).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FOOD_BASE_UNIT,
  FOOD_UNITS,
  type FoodIngredient,
  type FoodRecipe,
  foodIngredientCatalogSchema,
  foodMenuVersionSchema,
  foodRecipeSchema,
  foodSavedPlanSchema,
} from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = join(import.meta.dirname, '../../reference/food');
const readYaml = (path: string): unknown => parse(readFileSync(path, 'utf8'));

const catalog = foodIngredientCatalogSchema.parse(readYaml(join(ROOT, 'ingredients.yaml')));
const ingredients = new Map(catalog.ingredients.map((i) => [i.id, i]));
const recipeFiles = readdirSync(join(ROOT, 'recipes')).filter((f) => f.endsWith('.yaml'));
const recipes = new Map(
  recipeFiles.map((f) => {
    const recipe = foodRecipeSchema.parse(readYaml(join(ROOT, 'recipes', f)));
    return [recipe.id, { recipe, file: f }];
  }),
);

/* Exact fractions with BigInt. */
type Frac = { n: bigint; d: bigint };
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const frac = (n: bigint, d = 1n): Frac => {
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const fromDecimal = (s: string): Frac => {
  const [whole, part = ''] = s.split('.');
  return frac(BigInt(whole + part), 10n ** BigInt(part.length));
};
const mul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
const add = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const ceil = (a: Frac) => frac((a.n + a.d - 1n) / a.d);
/** Exact decimal string; the denominator must be a product of 2s and 5s. */
const toDecimal = (a: Frac): string => {
  let scale = 0;
  while (10n ** BigInt(scale) % a.d !== 0n) {
    scale++;
    if (scale > 30) throw new Error('not a finite decimal');
  }
  const digits = ((a.n * 10n ** BigInt(scale)) / a.d).toString().padStart(scale + 1, '0');
  if (scale === 0) return digits;
  const text = `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return text.replace(/0+$/, '').replace(/\.$/, '');
};

interface Line {
  ingredient: string;
  total: string;
  unit: string;
  buy: string;
  usedIn: string[];
}

function consolidate(selected: FoodRecipe[], guests: number, servingsPerGuest: string) {
  const totals = new Map<string, { sum: Frac; usedIn: string[] }>();
  const scale = selected.map((r) => {
    const factor = frac(
      BigInt(guests) * fromDecimal(servingsPerGuest).n,
      BigInt(r.servings) * fromDecimal(servingsPerGuest).d,
    );
    for (const line of r.ingredients) {
      const base = mul(fromDecimal(line.quantity), fromDecimal(FOOD_UNITS[line.unit].toBase));
      const entry = totals.get(line.ingredient) ?? { sum: frac(0n), usedIn: [] };
      entry.sum = add(entry.sum, mul(base, factor));
      if (!entry.usedIn.includes(r.id)) entry.usedIn.push(r.id);
      totals.set(line.ingredient, entry);
    }
    return { recipe: r.id, factor: toDecimal(factor) };
  });
  const lines: Line[] = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, { sum, usedIn }]) => {
      const dimension = (ingredients.get(id) as FoodIngredient).dimension;
      const buy = dimension === 'count' ? ceil(sum) : sum;
      return {
        ingredient: id,
        total: toDecimal(sum),
        unit: FOOD_BASE_UNIT[dimension],
        buy: toDecimal(buy),
        usedIn,
      };
    });
  return { scale, lines };
}

describe('food reference data', () => {
  it('has unique ingredient ids', () => {
    expect(ingredients.size).toBe(catalog.ingredients.length);
  });

  it('names every recipe file after its id and keeps at least two sources', () => {
    for (const { recipe, file } of recipes.values()) {
      expect(file).toBe(`${recipe.id}.yaml`);
      expect(recipe.sources.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses only known ingredients, each in its own dimension', () => {
    for (const { recipe } of recipes.values()) {
      for (const line of recipe.ingredients) {
        const ingredient = ingredients.get(line.ingredient);
        expect(ingredient, `${recipe.id}: ${line.ingredient}`).toBeDefined();
        expect(FOOD_UNITS[line.unit].dimension, `${recipe.id}: ${line.ingredient}`).toBe(
          ingredient?.dimension,
        );
      }
    }
  });

  it('keeps each recipe diet consistent with its ingredients', () => {
    for (const { recipe } of recipes.values()) {
      for (const line of recipe.ingredients) {
        expect(ingredients.get(line.ingredient)?.notFor ?? []).not.toContain(recipe.diet);
      }
    }
  });

  it('marks no recipe approved or kitchen-tested without a person having done it', () => {
    for (const { recipe } of recipes.values()) {
      expect(['draft', 'source-checked']).toContain(recipe.verification.status);
    }
  });
});

describe('golden fixture 001: three recipes for 50 guests', () => {
  const fixture = readYaml(join(ROOT, 'fixtures/001-three-recipes-50-guests.yaml')) as {
    input: {
      guests: number;
      servingsPerGuest: string;
      recipes: { recipe: string; recipeVersion: string }[];
    };
    expected: { scale: unknown; lines: Line[]; allergens: string[]; diet: string };
  };
  const selected = fixture.input.recipes.map(({ recipe, recipeVersion }) => {
    const found = recipes.get(recipe)?.recipe;
    expect(found?.version, recipe).toBe(recipeVersion);
    return found as FoodRecipe;
  });

  it('reproduces scale factors and consolidated lines exactly', () => {
    const result = consolidate(selected, fixture.input.guests, fixture.input.servingsPerGuest);
    expect(result.scale).toEqual(fixture.expected.scale);
    expect(result.lines).toEqual(fixture.expected.lines);
  });

  it('carries allergens and the common diet', () => {
    const allergens = new Set(
      selected.flatMap((r) =>
        r.ingredients.flatMap((l) => ingredients.get(l.ingredient)?.allergens ?? []),
      ),
    );
    expect([...allergens].sort()).toEqual(fixture.expected.allergens);
    const diet = selected.every((r) => r.diet === 'vegan') ? 'vegan' : 'vegetarian';
    expect(diet).toBe(fixture.expected.diet);
  });
});

describe('menu versions and saved plans', () => {
  const menu = {
    id: 'small-party-2026-11-01-1',
    category: 'small-party',
    status: 'published',
    region: 'IN',
    createdAt: '2026-11-01T00:00:00+05:30',
    publishedAt: '2026-11-01T06:00:00+05:30',
    reviewBy: '2026-12-01',
    items: [
      {
        recipe: 'jeera-rice',
        recipeVersion: '0.1.0',
        reasons: [{ kind: 'verified-foundation', note: 'Staple rice' }],
      },
      {
        recipe: 'dal-tadka',
        recipeVersion: '0.1.0',
        reasons: [{ kind: 'verified-foundation', note: 'Staple dal' }],
      },
      {
        recipe: 'aloo-gobi',
        recipeVersion: '0.1.0',
        reasons: [
          { kind: 'seasonal', season: 'winter', note: 'Cauliflower is a winter vegetable' },
        ],
      },
    ],
    validation: { passed: true, checks: ['all recipes source-checked'], fellBackToPrevious: false },
  };

  it('accepts a valid published version', () => {
    expect(foodMenuVersionSchema.safeParse(menu).success).toBe(true);
  });

  it('rejects a trend reason with no recorded observation', () => {
    const bad = structuredClone(menu);
    bad.items[2].reasons = [{ kind: 'observed-trend', observation: 0, note: 'x' } as never];
    expect(foodMenuVersionSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a published version without publishedAt or with failed validation', () => {
    expect(foodMenuVersionSchema.safeParse({ ...menu, publishedAt: undefined }).success).toBe(
      false,
    );
    expect(
      foodMenuVersionSchema.safeParse({
        ...menu,
        validation: { ...menu.validation, passed: false },
      }).success,
    ).toBe(false);
  });

  it('rejects an id that does not match the category', () => {
    expect(foodMenuVersionSchema.safeParse({ ...menu, id: 'wedding-2026-11-01-1' }).success).toBe(
      false,
    );
  });

  it('accepts a saved plan pinned to a menu version', () => {
    const plan = {
      schema: 1,
      menuVersion: menu.id,
      recipes: menu.items.map(({ recipe, recipeVersion }) => ({ recipe, recipeVersion })),
      guests: 50,
      budgetInr: '25000',
      prices: [
        {
          ingredient: 'toor-dal',
          kind: 'user-entered',
          priceInr: '160',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-02',
        },
      ],
      savedAt: '2026-11-02T10:00:00+05:30',
    };
    expect(foodSavedPlanSchema.safeParse(plan).success).toBe(true);
  });
});
