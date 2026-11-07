import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { costEstimate } from '../../engines/food/src/operations/cost-estimate/operation.ts';
import type {
  CostEstimateInput,
  CostEstimateOutput,
  CostEstimateParams,
  CostItemOutput,
} from '../../engines/food/src/operations/cost-estimate/schema.ts';

const run = async (input: Partial<CostEstimateInput>, params: Partial<CostEstimateParams> = {}) => {
  const fullInput: CostEstimateInput = {
    guests: input.guests ?? 50,
    lines: input.lines ?? [
      { ingredient: 'basmati-rice', buy: '2500', unit: 'g' },
      { ingredient: 'toor-dal', buy: '2500', unit: 'g' },
      { ingredient: 'ghee', buy: '562.5', unit: 'ml' },
      { ingredient: 'tomato', buy: '38', unit: 'piece' },
    ],
    prices: input.prices ?? [
      {
        ingredient: 'basmati-rice',
        kind: 'retail-reference',
        priceInr: '120',
        per: '1',
        unit: 'kg',
        observedOn: '2026-11-01',
      },
      {
        ingredient: 'toor-dal',
        kind: 'retail-reference',
        priceInr: '160',
        per: '1',
        unit: 'kg',
        observedOn: '2026-11-01',
      },
      {
        ingredient: 'ghee',
        kind: 'retail-reference',
        priceInr: '650',
        per: '1',
        unit: 'l',
        observedOn: '2026-11-01',
      },
      {
        ingredient: 'tomato',
        kind: 'retail-reference',
        priceInr: '5',
        per: '1',
        unit: 'piece',
        observedOn: '2026-11-01',
      },
    ],
    budgetInr: input.budgetInr,
  };

  const fullParams: CostEstimateParams = {
    pricePriority: params.pricePriority ?? 'user-then-retail',
    quantityBasis: params.quantityBasis ?? 'buy',
  };

  const res = await executeOperation(costEstimate, fullInput, fullParams, createTestContext());
  if (!res.ok) return res;
  return { ok: true as const, value: res.value as CostEstimateOutput, warnings: res.warnings };
};

describe('food.cost.estimate@1 calculation', () => {
  it('calculates staple costs accurately using retail references', async () => {
    const res = await run({});
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalCostInr).toBe('1255.63');
    expect(res.value.exactTotalCost).toBe('1255.625');
    expect(res.value.costPerGuestInr).toBe('25.11');
    expect(res.value.pricedCount).toBe(4);
    expect(res.value.unpricedCount).toBe(0);
    expect(res.value.unpricedIngredients).toEqual([]);
  });

  it('prefers user-entered prices over retail references', async () => {
    const res = await run({
      lines: [{ ingredient: 'toor-dal', buy: '1000', unit: 'g' }],
      prices: [
        {
          ingredient: 'toor-dal',
          kind: 'retail-reference',
          priceInr: '160',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-01',
        },
        {
          ingredient: 'toor-dal',
          kind: 'user-entered',
          priceInr: '135',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-03',
        },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalCostInr).toBe('135.00');
    expect(res.value.items[0].priceKind).toBe('user-entered');
  });

  it('handles missing prices with warning and unpriced count', async () => {
    const res = await run({
      lines: [
        { ingredient: 'basmati-rice', buy: '1000', unit: 'g' },
        { ingredient: 'bay-leaf', buy: '10', unit: 'piece' },
      ],
      prices: [
        {
          ingredient: 'basmati-rice',
          kind: 'retail-reference',
          priceInr: '120',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-01',
        },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalCostInr).toBe('120.00');
    expect(res.value.pricedCount).toBe(1);
    expect(res.value.unpricedCount).toBe(1);
    expect(res.value.unpricedIngredients).toEqual(['bay-leaf']);
    expect(res.warnings.map((w) => w.code)).toContain('FOOD_MISSING_PRICE');
  });

  it('correctly compares with budget when under-budget', async () => {
    const res = await run({
      guests: 20,
      budgetInr: '2000',
      lines: [
        { ingredient: 'basmati-rice', buy: '2000', unit: 'g' },
        { ingredient: 'toor-dal', buy: '2000', unit: 'g' },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // rice: 2 * 120 = 240, dal: 2 * 160 = 320 -> total 560
    expect(res.value.totalCostInr).toBe('560.00');
    expect(res.value.budgetInr).toBe('2000.00');
    expect(res.value.budgetVarianceInr).toBe('1440.00');
    expect(res.value.budgetStatus).toBe('under-budget');
  });

  it('warns when total cost exceeds budget', async () => {
    const res = await run({
      budgetInr: '500',
      lines: [{ ingredient: 'basmati-rice', buy: '5000', unit: 'g' }],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // rice: 5 * 120 = 600 vs budget 500 -> diff 100
    expect(res.value.totalCostInr).toBe('600.00');
    expect(res.value.budgetStatus).toBe('over-budget');
    expect(res.value.budgetVarianceInr).toBe('-100.00');
    expect(res.warnings.map((w) => w.code)).toContain('FOOD_BUDGET_EXCEEDED');
  });

  it('accumulates exact rational fractions without floating point drift', async () => {
    const res = await run({
      guests: 3,
      lines: [
        { ingredient: 'item-a', buy: '100', unit: 'g' },
        { ingredient: 'item-b', buy: '100', unit: 'g' },
        { ingredient: 'item-c', buy: '100', unit: 'g' },
      ],
      prices: [
        {
          ingredient: 'item-a',
          kind: 'retail-reference',
          priceInr: '1',
          per: '300',
          unit: 'g',
          observedOn: '2026-11-01',
        },
        {
          ingredient: 'item-b',
          kind: 'retail-reference',
          priceInr: '1',
          per: '300',
          unit: 'g',
          observedOn: '2026-11-01',
        },
        {
          ingredient: 'item-c',
          kind: 'retail-reference',
          priceInr: '1',
          per: '300',
          unit: 'g',
          observedOn: '2026-11-01',
        },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // 1/3 + 1/3 + 1/3 = 1.00 INR, never 0.99
    expect(res.value.totalCostInr).toBe('1.00');
    expect(res.value.exactTotalCost).toBe('1');
    expect(res.value.items.map((i: CostItemOutput) => i.costInr)).toEqual(['0.33', '0.33', '0.33']);
  });

  it('rejects dimension mismatch between line and price', async () => {
    const res = await run({
      lines: [{ ingredient: 'basmati-rice', buy: '500', unit: 'g' }],
      prices: [
        {
          ingredient: 'basmati-rice',
          kind: 'retail-reference',
          priceInr: '120',
          per: '1',
          unit: 'l', // volume for mass
          observedOn: '2026-11-01',
        },
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('FOOD_PRICE_DIMENSION_MISMATCH');
  });

  it('rejects duplicate price of the same kind for an ingredient', async () => {
    const res = await run({
      lines: [{ ingredient: 'basmati-rice', buy: '500', unit: 'g' }],
      prices: [
        {
          ingredient: 'basmati-rice',
          kind: 'retail-reference',
          priceInr: '120',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-01',
        },
        {
          ingredient: 'basmati-rice',
          kind: 'retail-reference',
          priceInr: '130',
          per: '1',
          unit: 'kg',
          observedOn: '2026-11-02',
        },
      ],
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe('FOOD_DUPLICATE_PRICE');
  });
});
