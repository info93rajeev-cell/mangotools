import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const priceKindSchema = z.enum(['wholesale-reference', 'retail-reference', 'user-entered']);
const unitSchema = z.enum(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece']);
const baseUnitSchema = z.enum(['g', 'ml', 'piece']);

const line = z.strictObject({
  ingredient: id,
  buy: z.string().max(20),
  unit: baseUnitSchema,
  total: z.string().max(20).optional(),
});

const price = z.strictObject({
  ingredient: id,
  kind: priceKindSchema,
  priceInr: z.string().max(20),
  per: z.string().max(20),
  unit: unitSchema,
  source: z
    .strictObject({
      name: z.string().min(1).max(120),
      url: z.string().url().optional(),
      market: z.string().max(80).optional(),
    })
    .optional(),
  observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const costEstimateInput = z.strictObject({
  lines: z.array(line).min(1).max(500),
  prices: z.array(price).max(500).default([]),
  guests: z.int().min(1).max(100000),
  budgetInr: z.string().max(20).optional(),
});

export const costEstimateParams = z.strictObject({
  pricePriority: z
    .enum(['user-then-retail', 'user-then-wholesale', 'retail-only', 'wholesale-only'])
    .default('user-then-retail'),
  quantityBasis: z.enum(['buy', 'total']).default('buy'),
});

const itemOutput = z.strictObject({
  ingredient: id,
  quantity: z.string(),
  unit: baseUnitSchema,
  isPriced: z.boolean(),
  priceKind: z.enum(['user-entered', 'retail-reference', 'wholesale-reference', 'unpriced']),
  ratePerBaseUnitInr: z.string().optional(),
  costInr: z.string(),
  exactCost: z.string(),
  source: z
    .strictObject({
      name: z.string(),
      url: z.string().optional(),
      market: z.string().optional(),
    })
    .optional(),
  observedOn: z.string().optional(),
});

export const costEstimateOutput = z.strictObject({
  items: z.array(itemOutput),
  totalCostInr: z.string(),
  exactTotalCost: z.string(),
  costPerGuestInr: z.string(),
  budgetInr: z.string().optional(),
  budgetVarianceInr: z.string().optional(),
  budgetStatus: z.enum(['under-budget', 'on-budget', 'over-budget', 'no-budget']),
  pricedCount: z.int(),
  unpricedCount: z.int(),
  unpricedIngredients: z.array(id),
});

export type CostEstimateInput = z.infer<typeof costEstimateInput>;
export type CostEstimateParams = z.infer<typeof costEstimateParams>;
export type CostEstimateOutput = z.infer<typeof costEstimateOutput>;
export type CostLineInput = CostEstimateInput['lines'][number];
export type CostPriceInput = CostEstimateInput['prices'][number];
export type CostItemOutput = CostEstimateOutput['items'][number];
