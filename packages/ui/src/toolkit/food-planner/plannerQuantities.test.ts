import { describe, expect, it } from 'vitest';
import { enteredPrices, priceBasis } from './plannerPrices.ts';
import { applyIngredientQuantities, remainingQuantity } from './plannerQuantities.ts';

describe('shared ingredient and price edits', () => {
  const output = {
    lines: [
      { ingredient: 'basmati-rice', total: '2000', buy: '2000', unit: 'g', usedIn: ['jeera-rice'] },
    ],
  };
  it('deducts entered pantry stock without changing requirements or mutating engine results', () => {
    const result = applyIngredientQuantities(output, {}, { 'basmati-rice': '500' });
    expect(result.lines[0]).toMatchObject({ total: '2000', buy: '1500', unit: 'g' });
    expect(output.lines[0]?.buy).toBe('2000');
    expect(applyIngredientQuantities(output, {}, { 'basmati-rice': '3000' }).lines[0]?.buy).toBe(
      '0',
    );
  });
  it('shares absolute edits and deletions and adds catalogue ingredients in canonical units', () => {
    const result = applyIngredientQuantities(output, { 'basmati-rice': '0', tomato: '100' }, {});
    expect(result.lines).toEqual([
      { ingredient: 'tomato', total: '100', buy: '100', unit: 'piece', usedIn: [] },
    ]);
  });
  it('retains an explicit zero price and its reference pack basis', () => {
    expect(enteredPrices({ 'basmati-rice': '0' }, 'retail', '2026-11-09')).toEqual([
      {
        ingredient: 'basmati-rice',
        priceInr: '0',
        per: '1',
        unit: 'kg',
        kind: 'user-entered',
        observedOn: '2026-11-09',
      },
    ]);
    expect(priceBasis('basmati-rice', 'wholesale')).toMatchObject({ priceInr: '95', unit: 'kg' });
  });
});

it('subtracts fractional stock as exact plain decimals', () => {
  expect(remainingQuantity('0.3', '0.1')).toBe('0.2');
  expect(remainingQuantity('1.000001', '0.999999')).toBe('0.000002');
  expect(remainingQuantity('1000.0', '0')).toBe('1000');
});
