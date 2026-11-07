/**
 * Food Planner reference data: units, ingredients, allergens, recipes with sources, menu
 * versions, saved plans and price references. Data only — no formulas. Proposed in
 * docs/decisions/DECISION-FOOD-PLANNER-DATA.md (TASK-FP-001).
 */
import { z } from 'zod';
import { isoDate, kebabId, semver } from './common.ts';

/** Plain non-negative decimal string, e.g. "200" or "0.25". Never a float. */
export const foodDecimal = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Use a plain non-negative decimal string.');

/** Physical dimension a quantity is measured in. Quantities are only added within one dimension. */
export const foodDimensionSchema = z.enum(['mass', 'volume', 'count']);

/**
 * Recipe units. Spoons and cups are metric kitchen measures (5 ml, 15 ml, 250 ml), the
 * definitions used by Indian recipe sources; there is no conversion between dimensions.
 */
export const FOOD_UNITS = {
  g: { dimension: 'mass', toBase: '1' },
  kg: { dimension: 'mass', toBase: '1000' },
  ml: { dimension: 'volume', toBase: '1' },
  l: { dimension: 'volume', toBase: '1000' },
  tsp: { dimension: 'volume', toBase: '5' },
  tbsp: { dimension: 'volume', toBase: '15' },
  cup: { dimension: 'volume', toBase: '250' },
  piece: { dimension: 'count', toBase: '1' },
} as const satisfies Record<
  string,
  { dimension: z.infer<typeof foodDimensionSchema>; toBase: string }
>;

export const foodUnitSchema = z.enum(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece']);
export type FoodUnit = z.infer<typeof foodUnitSchema>;

/** Base unit per dimension: what shopping totals are expressed in. */
export const FOOD_BASE_UNIT = { mass: 'g', volume: 'ml', count: 'piece' } as const;

/**
 * Allergen groups declared under the FSSAI labelling rules (cereals containing gluten, crustacean,
 * milk, egg, fish, peanut and tree nuts, soybean, sulphite ≥ 10 mg/kg). Peanut and tree nut are
 * kept apart because people are often allergic to one and not the other.
 */
export const foodAllergenSchema = z.enum([
  'gluten-cereals',
  'crustacean',
  'milk',
  'egg',
  'fish',
  'peanut',
  'tree-nut',
  'soy',
  'sulphite',
]);

export const foodDietSchema = z.enum([
  'vegetarian',
  'vegan',
  'jain',
  'eggetarian',
  'non-vegetarian',
]);

export const foodIngredientSchema = z.strictObject({
  id: kebabId,
  name: z.string().min(1).max(80),
  /** Local names as commonly written, e.g. "jeera". */
  aliases: z.array(z.string().min(1).max(40)).max(8).default([]),
  dimension: foodDimensionSchema,
  /** Shopping category, used to group the shopping list. */
  aisle: z.enum([
    'grains',
    'pulses',
    'vegetables',
    'herbs',
    'spices',
    'oils-fats',
    'dairy',
    'other',
  ]),
  allergens: z.array(foodAllergenSchema).default([]),
  /** Diets this ingredient is NOT suitable for (e.g. onion and garlic for jain). */
  notFor: z.array(foodDietSchema).default([]),
  /** For count ingredients: what one piece means, e.g. "medium, about the size of a fist". */
  pieceNote: z.string().max(120).optional(),
});

export const foodIngredientCatalogSchema = z.strictObject({
  version: semver,
  updated: isoDate,
  ingredients: z.array(foodIngredientSchema).min(1),
});

export const foodRecipeSourceSchema = z.strictObject({
  title: z.string().min(1).max(160),
  publisher: z.string().min(1).max(80),
  url: z.url(),
  accessed: isoDate,
  /** What this source was used to check, e.g. "rice : servings, ghee and cumin amounts". */
  checks: z.string().min(1).max(300),
});

export const foodRecipeLineSchema = z.strictObject({
  ingredient: kebabId,
  quantity: foodDecimal,
  unit: foodUnitSchema,
  note: z.string().max(80).optional(),
});

/**
 * draft: written, not checked. source-checked: quantities cross-checked against at least two
 * published recipes. kitchen-tested: cooked and confirmed. approved: accepted by the founder for
 * use in published menus.
 */
export const foodRecipeStatusSchema = z.enum([
  'draft',
  'source-checked',
  'kitchen-tested',
  'approved',
]);

export const foodRecipeSchema = z.strictObject({
  id: kebabId,
  /** A changed recipe gets a new version; menus pin the version they were published with. */
  version: semver,
  name: z.string().min(1).max(80),
  localName: z.string().max(80).optional(),
  course: z.enum(['main', 'rice', 'bread', 'dal', 'side', 'snack', 'dessert', 'drink']),
  cuisine: z.string().min(1).max(40),
  diet: foodDietSchema,
  /** Number of servings the listed quantities make. */
  servings: z.int().min(1).max(500),
  prepMinutes: z.int().min(0).max(1440),
  cookMinutes: z.int().min(0).max(1440),
  ingredients: z.array(foodRecipeLineSchema).min(1).max(60),
  /** Original instructions written for BeyondTheAI, never copied from a source. */
  steps: z.array(z.string().min(1).max(400)).min(1).max(30),
  sources: z.array(foodRecipeSourceSchema).min(2),
  verification: z.strictObject({
    status: foodRecipeStatusSchema,
    by: z.string().min(1).max(80),
    date: isoDate,
    notes: z.string().max(600),
  }),
});

export type FoodIngredient = z.infer<typeof foodIngredientSchema>;
export type FoodRecipe = z.infer<typeof foodRecipeSchema>;
