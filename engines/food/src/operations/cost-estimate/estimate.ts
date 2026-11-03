import { type OpWarning, warning } from '@mangotools/core';
import {
  addF,
  cmpF,
  divF,
  type Fraction,
  fraction,
  mulF,
  subF,
  toDecimal,
  toMoneyDecimal,
  ZERO,
} from '../../exact-quantity.ts';
import type {
  CostEstimateOutput,
  CostEstimateParams,
  CostItemOutput,
  CostPriceInput,
} from './schema.ts';
import type { ValidatedCostInput } from './validate.ts';

const PRIORITY_ORDER: Readonly<Record<CostEstimateParams['pricePriority'], readonly string[]>> = {
  'user-then-retail': ['user-entered', 'retail-reference', 'wholesale-reference'],
  'user-then-wholesale': ['user-entered', 'wholesale-reference', 'retail-reference'],
  'retail-only': ['retail-reference'],
  'wholesale-only': ['wholesale-reference'],
};

function selectPrice(
  byKind: Map<string, { raw: CostPriceInput; rate: Fraction }> | undefined,
  priority: CostEstimateParams['pricePriority'],
): { raw: CostPriceInput; rate: Fraction } | undefined {
  if (!byKind) return undefined;
  for (const kind of PRIORITY_ORDER[priority]) {
    const found = byKind.get(kind);
    if (found) return found;
  }
  return undefined;
}

function processLineItem(
  line: ValidatedCostInput['lines'][number],
  byKind: Map<string, { raw: CostPriceInput; rate: Fraction }> | undefined,
  priority: CostEstimateParams['pricePriority'],
): { item: CostItemOutput; cost: Fraction; warn?: OpWarning } {
  const selected = selectPrice(byKind, priority);
  const qtyText = toDecimal(line.quantity).text;

  if (selected) {
    const lineCost = mulF(line.quantity, selected.rate);
    return {
      cost: lineCost,
      item: {
        ingredient: line.raw.ingredient,
        quantity: qtyText,
        unit: line.raw.unit,
        isPriced: true,
        priceKind: selected.raw.kind,
        ratePerBaseUnitInr: toDecimal(selected.rate).text,
        costInr: toMoneyDecimal(lineCost),
        exactCost: toDecimal(lineCost).text,
        source: selected.raw.source,
        observedOn: selected.raw.observedOn,
      },
    };
  }

  return {
    cost: ZERO,
    warn: warning('FOOD_MISSING_PRICE', {
      details: { ingredient: line.raw.ingredient },
    }),
    item: {
      ingredient: line.raw.ingredient,
      quantity: qtyText,
      unit: line.raw.unit,
      isPriced: false,
      priceKind: 'unpriced',
      costInr: '0.00',
      exactCost: '0',
    },
  };
}

function evaluateBudget(
  totalCost: Fraction,
  totalCostInr: string,
  budget?: Fraction,
): {
  budgetInr?: string;
  varianceInr?: string;
  status: CostEstimateOutput['budgetStatus'];
  warn?: OpWarning;
} {
  if (!budget) return { status: 'no-budget' };
  const budgetInr = toMoneyDecimal(budget);
  const variance = subF(budget, totalCost);
  const cmp = cmpF(totalCost, budget);

  if (cmp > 0) {
    const diff = subF(totalCost, budget);
    return {
      budgetInr,
      varianceInr: toMoneyDecimal(variance),
      status: 'over-budget',
      warn: warning('FOOD_BUDGET_EXCEEDED', {
        details: { total: totalCostInr, budget: budgetInr, difference: toMoneyDecimal(diff) },
      }),
    };
  }
  return {
    budgetInr,
    varianceInr: toMoneyDecimal(variance),
    status: cmp === 0 ? 'on-budget' : 'under-budget',
  };
}

export function estimateCost(
  validated: ValidatedCostInput,
  params: CostEstimateParams,
  guests: number,
): { output: CostEstimateOutput; warnings: OpWarning[] } {
  const warnings: OpWarning[] = [];
  const items: CostItemOutput[] = [];
  let totalCost = ZERO;
  const unpricedIngredients: string[] = [];

  for (const line of validated.lines) {
    const byKind = validated.pricesByIngredient.get(line.raw.ingredient);
    const { item, cost, warn } = processLineItem(line, byKind, params.pricePriority);
    items.push(item);
    totalCost = addF(totalCost, cost);
    if (warn) {
      warnings.push(warn);
      unpricedIngredients.push(line.raw.ingredient);
    }
  }

  items.sort((a, b) => (a.ingredient < b.ingredient ? -1 : a.ingredient > b.ingredient ? 1 : 0));
  unpricedIngredients.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const totalCostInr = toMoneyDecimal(totalCost);
  const costPerGuest = divF(totalCost, fraction(BigInt(guests)));
  const bResult = evaluateBudget(totalCost, totalCostInr, validated.budget);
  if (bResult.warn) warnings.push(bResult.warn);

  return {
    output: {
      items,
      totalCostInr,
      exactTotalCost: toDecimal(totalCost).text,
      costPerGuestInr: toMoneyDecimal(costPerGuest),
      budgetInr: bResult.budgetInr,
      budgetVarianceInr: bResult.varianceInr,
      budgetStatus: bResult.status,
      pricedCount: items.length - unpricedIngredients.length,
      unpricedCount: unpricedIngredients.length,
      unpricedIngredients,
    },
    warnings,
  };
}
