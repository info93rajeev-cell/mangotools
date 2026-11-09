import { expect, it } from 'vitest';
import type { IngredientLineItem } from './ingredientsUtils.ts';
import { inventoryValue } from './inventoryValue.ts';

it('values entered stock in base units using exact pack-based arithmetic and zero overrides', () => {
  const items = [{ id: 'basmati-rice' }, { id: 'ghee' }] as IngredientLineItem[];
  const planner = {
    priceMode: 'retail' as const,
    stockQuantities: { 'basmati-rice': '500', ghee: '100' },
    userPrices: { 'basmati-rice': '100', ghee: '650' },
  };
  expect(inventoryValue(items, planner)).toBe('115.00');
  expect(
    inventoryValue(items, { ...planner, userPrices: { ...planner.userPrices, ghee: '0' } }),
  ).toBe('50.00');
});
