import { FOOD_UNITS } from '@mangotools/schemas';
import type { IngredientLineItem } from './ingredientsUtils.ts';
import { priceBasis } from './plannerPrices.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

const micros = (value: string) => {
  const [whole = '0', part = ''] = value.split('.');
  return /^\d+(?:\.\d+)?$/.test(value)
    ? BigInt(whole) * 1_000_000n + BigInt(`${part}000000`.slice(0, 6))
    : 0n;
};

export function inventoryValue(
  items: IngredientLineItem[],
  planner: Pick<UseFoodPlannerReturn, 'stockQuantities' | 'userPrices' | 'priceMode'>,
): string {
  let total = 0n;
  for (const item of items) {
    const stock = planner.stockQuantities[item.id];
    if (stock === undefined) continue;
    const basis = priceBasis(item.id, planner.priceMode);
    const price = planner.userPrices[item.id] ?? ('priceInr' in basis ? basis.priceInr : undefined);
    if (price === undefined) continue;
    const unit = basis.unit.toLowerCase() as keyof typeof FOOD_UNITS;
    const scale = FOOD_UNITS[unit]?.toBase;
    if (!scale) continue;
    const per = micros(basis.per) * BigInt(scale);
    if (per > 0n) total += (micros(stock) * micros(price)) / per;
  }
  const cents = (total + 5000n) / 10_000n;
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}
