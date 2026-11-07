import {
  addF,
  ceilF,
  divF,
  type Fraction,
  fraction,
  mulF,
  parseQuantity,
  toDecimal,
  ZERO,
} from '../../exact-quantity.ts';
import type { IngredientInput, ShoppingOutput } from './schema.ts';
import { BASE_UNIT, UNITS } from './units.ts';
import type { Selected } from './validate.ts';

interface Total {
  sum: Fraction;
  usedIn: string[];
}

/** Scale = guests × servings per guest × portion factor ÷ recipe servings, kept exact. */
export function scaleFactor(guests: number, perGuest: Fraction, item: Selected): Fraction {
  const people = fraction(BigInt(guests));
  return divF(mulF(mulF(people, perGuest), item.portion), fraction(BigInt(item.recipe.servings)));
}

/** Adds every line of every recipe in base units, per ingredient. Validated input only. */
export function sumLines(items: { item: Selected; factor: Fraction }[]): Map<string, Total> {
  const totals = new Map<string, Total>();
  for (const { item, factor } of items) {
    for (const line of item.recipe.ingredients) {
      const unit = UNITS[line.unit];
      const amount = parseQuantity(line.quantity);
      if (!unit || !amount) continue;
      const entry = totals.get(line.ingredient) ?? { sum: ZERO, usedIn: [] };
      entry.sum = addF(entry.sum, mulF(mulF(amount, unit.toBase), factor));
      if (!entry.usedIn.includes(item.recipe.id)) entry.usedIn.push(item.recipe.id);
      totals.set(line.ingredient, entry);
    }
  }
  return totals;
}

/**
 * Shopping lines sorted by ingredient id. Mass and volume are exact; count items are rounded up
 * only here, after every recipe has been added. Values with no finite decimal are reported.
 */
export function toLines(
  totals: Map<string, Total>,
  ingredients: Map<string, IngredientInput>,
  rounded: string[],
): ShoppingOutput['lines'] {
  const ids = [...totals.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return ids.map((id) => {
    const { sum, usedIn } = totals.get(id) as Total;
    const dimension = (ingredients.get(id) as IngredientInput).dimension;
    const total = toDecimal(sum);
    if (!total.exact) rounded.push(`line:${id}`);
    const buy = dimension === 'count' ? toDecimal(ceilF(sum)).text : total.text;
    return { ingredient: id, total: total.text, unit: BASE_UNIT[dimension], buy, usedIn };
  });
}

export function allergensOf(item: Selected, ingredients: Map<string, IngredientInput>): string[] {
  const set = new Set<string>();
  for (const line of item.recipe.ingredients) {
    for (const allergen of ingredients.get(line.ingredient)?.allergens ?? []) set.add(allergen);
  }
  return [...set].sort();
}
