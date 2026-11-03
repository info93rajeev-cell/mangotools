import type { DetailValue } from '@mangotools/core';
import { type Fraction, parseQuantity } from '../../exact-quantity.ts';
import { unitOf } from '../../units.ts';
import type { CostEstimateInput, CostLineInput, CostPriceInput } from './schema.ts';

export interface CostFailure {
  code: string;
  path?: string;
  details?: Record<string, DetailValue>;
}

export interface ValidatedCostInput {
  lines: Array<{
    raw: CostLineInput;
    quantity: Fraction;
  }>;
  pricesByIngredient: Map<string, Map<string, { raw: CostPriceInput; rate: Fraction }>>;
  budget?: Fraction;
}

function fail(code: string, details?: Record<string, DetailValue>, path?: string): CostFailure {
  const f: CostFailure = { code };
  if (details) f.details = details;
  if (path) f.path = path;
  return f;
}

function validateLine(
  line: CostLineInput,
  quantityBasis: 'buy' | 'total',
): { quantity: Fraction } | CostFailure {
  const amountStr = quantityBasis === 'total' && line.total ? line.total : line.buy;
  const q = parseQuantity(amountStr);
  if (!q || q.n <= 0n) {
    return fail(
      'FOOD_INVALID_QUANTITY',
      { value: amountStr, ingredient: line.ingredient },
      'lines',
    );
  }
  return { quantity: q };
}

function validatePriceRate(
  price: CostPriceInput,
  lineUnit: 'g' | 'ml' | 'piece',
): { rate: Fraction } | CostFailure {
  const priceUnitInfo = unitOf(price.unit);
  const lineUnitInfo = unitOf(lineUnit);
  if (!priceUnitInfo || !lineUnitInfo || priceUnitInfo.dimension !== lineUnitInfo.dimension) {
    return fail(
      'FOOD_PRICE_DIMENSION_MISMATCH',
      { ingredient: price.ingredient, priceUnit: price.unit, lineUnit },
      'prices',
    );
  }
  const priceVal = parseQuantity(price.priceInr);
  const perVal = parseQuantity(price.per);
  if (!priceVal || priceVal.n < 0n || !perVal || perVal.n <= 0n) {
    return fail(
      'FOOD_INVALID_PRICE',
      { value: price.priceInr, ingredient: price.ingredient },
      'prices',
    );
  }
  const baseQty = { n: perVal.n * priceUnitInfo.toBase.n, d: perVal.d * priceUnitInfo.toBase.d };
  return { rate: { n: priceVal.n * baseQty.d, d: priceVal.d * baseQty.n } };
}

function collectPrices(
  prices: CostPriceInput[],
  lineMap: Map<string, CostLineInput>,
): Map<string, Map<string, { raw: CostPriceInput; rate: Fraction }>> | CostFailure {
  const pricesMap = new Map<string, Map<string, { raw: CostPriceInput; rate: Fraction }>>();
  for (const price of prices) {
    const line = lineMap.get(price.ingredient);
    if (!line) continue;
    let byKind = pricesMap.get(price.ingredient);
    if (!byKind) {
      byKind = new Map();
      pricesMap.set(price.ingredient, byKind);
    }
    if (byKind.has(price.kind)) {
      return fail(
        'FOOD_DUPLICATE_PRICE',
        { ingredient: price.ingredient, kind: price.kind },
        'prices',
      );
    }
    const rateRes = validatePriceRate(price, line.unit);
    if ('code' in rateRes) return rateRes;
    byKind.set(price.kind, { raw: price, rate: rateRes.rate });
  }
  return pricesMap;
}

function parseBudget(budgetInr?: string): Fraction | undefined | CostFailure {
  if (!budgetInr) return undefined;
  const b = parseQuantity(budgetInr);
  if (!b || b.n < 0n) {
    return fail('FOOD_INVALID_PRICE', { value: budgetInr, ingredient: 'budget' }, 'budgetInr');
  }
  return b;
}

export function validateCostInput(
  input: CostEstimateInput,
  quantityBasis: 'buy' | 'total',
): { ok: true; value: ValidatedCostInput } | { ok: false; error: CostFailure } {
  const lineMap = new Map<string, CostLineInput>();
  const validatedLines: ValidatedCostInput['lines'] = [];

  for (const line of input.lines) {
    const res = validateLine(line, quantityBasis);
    if ('code' in res) return { ok: false, error: res };
    lineMap.set(line.ingredient, line);
    validatedLines.push({ raw: line, quantity: res.quantity });
  }

  const pricesResult = collectPrices(input.prices, lineMap);
  if ('code' in pricesResult) return { ok: false, error: pricesResult };

  const budgetResult = parseBudget(input.budgetInr);
  if (budgetResult && 'code' in budgetResult) return { ok: false, error: budgetResult };

  return {
    ok: true,
    value: {
      lines: validatedLines,
      pricesByIngredient: pricesResult,
      budget: budgetResult,
    },
  };
}
