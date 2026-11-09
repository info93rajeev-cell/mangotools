import { describe, expect, it } from 'vitest';
import { parseInventoryCsv } from './InventoryTransfer.tsx';

describe('inventory CSV import', () => {
  it('accepts zero prices and blank overrides without changing quantity units', () => {
    expect(
      parseInventoryCsv('ingredient,required,stock,price\nbasmati-rice,2000,500,0\nghee,100,,'),
    ).toEqual({
      quantities: { 'basmati-rice': '2000', ghee: '100' },
      stock: { 'basmati-rice': '500', ghee: '' },
      prices: { 'basmati-rice': '0', ghee: '' },
      count: 2,
    });
  });
  it.each([
    'basmati-rice,2000,500,100\nbasmati-rice,100,0,0',
    'unknown,100,0,100',
    'basmati-rice,-1,0,0',
    'basmati-rice,2e3,0,0',
    'basmati-rice,2000,500',
    'basmati-rice,2000,0,=2+2',
  ])('rejects invalid complete imports atomically: %s', (rows) => {
    expect(parseInventoryCsv(`ingredient,required,stock,price\n${rows}`)).toBeNull();
  });
});
