import { z } from 'zod';

/**
 * Input shapes compatible with the Food Planner reference data (schemas/src/food.ts). Engines may
 * not import @mangotools/schemas, so only the fields this operation reads are declared; extra
 * fields (aliases, steps, sources…) are accepted and ignored. Units and quantities are plain
 * strings here so that an unknown unit or a malformed amount is a typed engine error, not a
 * generic input error.
 */
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const version = z.string().regex(/^\d+\.\d+\.\d+$/);
export const dimensionSchema = z.enum(['mass', 'volume', 'count']);
export const dietSchema = z.enum(['vegetarian', 'vegan', 'jain', 'eggetarian', 'non-vegetarian']);

const ingredient = z.looseObject({
  id,
  dimension: dimensionSchema,
  allergens: z.array(z.string()).default([]),
  notFor: z.array(dietSchema).default([]),
});

const recipe = z.looseObject({
  id,
  version,
  servings: z.int().min(1).max(500),
  diet: dietSchema,
  ingredients: z
    .array(
      z.looseObject({ ingredient: id, quantity: z.string().max(20), unit: z.string().max(10) }),
    )
    .min(1)
    .max(60),
  verification: z.looseObject({ status: z.string().max(30) }).optional(),
});

export const shoppingConsolidateInput = z.strictObject({
  ingredients: z.array(ingredient).min(1).max(2000),
  recipes: z.array(recipe).min(1).max(200),
  selection: z
    .array(
      z.strictObject({
        recipe: id,
        recipeVersion: version,
        portionFactor: z.string().max(10).optional(),
      }),
    )
    .min(1)
    .max(50),
  guests: z.int().min(1).max(100000),
  /** Servings each guest eats of every selected dish, before any per-dish portion factor. */
  servingsPerGuest: z.string().max(10).default('1'),
});

export const shoppingConsolidateParams = z.strictObject({
  /** Diet to check the selection against; none skips the check. */
  diet: z.enum(['none', 'vegetarian', 'vegan', 'jain']).default('none'),
  /** flag: list unsuitable recipes but keep them. exclude-recipes: leave whole recipes out. */
  dietPolicy: z.enum(['flag', 'exclude-recipes']).default('flag'),
});

const line = z.strictObject({
  ingredient: id,
  total: z.string(),
  unit: z.enum(['g', 'ml', 'piece']),
  buy: z.string(),
  usedIn: z.array(id),
});

export const shoppingConsolidateOutput = z.strictObject({
  scale: z.array(z.strictObject({ recipe: id, factor: z.string() })),
  lines: z.array(line),
  allergens: z.array(z.string()),
  diet: z.enum(['vegan', 'vegetarian', 'eggetarian', 'non-vegetarian']),
  recipes: z.array(
    z.strictObject({
      recipe: id,
      version,
      verification: z.string(),
      included: z.boolean(),
      allergens: z.array(z.string()),
      dietConflicts: z.array(id),
    }),
  ),
  rounded: z.array(z.string()),
});

export type ShoppingInput = z.infer<typeof shoppingConsolidateInput>;
export type ShoppingParams = z.infer<typeof shoppingConsolidateParams>;
export type ShoppingOutput = z.infer<typeof shoppingConsolidateOutput>;
export type RecipeInput = ShoppingInput['recipes'][number];
export type IngredientInput = ShoppingInput['ingredients'][number];
