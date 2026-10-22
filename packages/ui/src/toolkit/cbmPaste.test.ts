import { describe, expect, it } from 'vitest';
import { cleanNumber, isBlock, parseGrid, pastedValue, withoutHeader } from './cbmPaste.ts';
import { moveItem, withWeightUnit } from './cbmRowUnits.ts';

describe('CBM worksheet paste', () => {
  it('splits a spreadsheet copy (tabs and line breaks) into cells', () => {
    expect(parseGrid('Carton A\t60\t40\t40\t100\t12\r\nCarton B\t50\t30\t30\t80\t8\r\n')).toEqual([
      ['Carton A', '60', '40', '40', '100', '12'],
      ['Carton B', '50', '30', '30', '80', '8'],
    ]);
  });

  it('reads CSV and semicolon text with quoted commas, quotes and line breaks', () => {
    expect(parseGrid('"Box, large",60\n"Say ""hi""",1')).toEqual([
      ['Box, large', '60'],
      ['Say "hi"', '1'],
    ]);
    expect(parseGrid('Crate;120;100\n\n')).toEqual([['Crate', '120', '100']]);
    expect(parseGrid('"two\nlines"\t5')).toEqual([['two\nlines', '5']]);
  });

  it('treats only multi-cell text as a block; a single value pastes normally', () => {
    expect(isBlock('60')).toBe(false);
    expect(isBlock('60\n')).toBe(false);
    expect(isBlock('60\t40')).toBe(true);
    expect(isBlock('60\n40')).toBe(true);
  });

  it('drops a copied header row but never a data row', () => {
    const header = [
      ['Description / SKU', 'Length (cm)', 'Width (cm)'],
      ['A', '1', '2'],
    ];
    expect(withoutHeader(header)).toEqual([['A', '1', '2']]);
    const data = [['Carton', '60', '40']];
    expect(withoutHeader(data)).toEqual(data);
  });

  it('normalises grouped and binary-noise numbers without floating point', () => {
    expect(cleanNumber(' 1,250 ')).toBe('1250');
    expect(cleanNumber('0.30000000000000004')).toBe('0.3');
    expect(cleanNumber('2.99999999999999999')).toBe('3');
    expect(cleanNumber('12.5')).toBe('12.5');
    expect(cleanNumber('1,2')).toBe('1,2');
    expect(pastedValue('description', '  Wooden crate  ')).toBe('Wooden crate');
    expect(pastedValue('description', 'x'.repeat(200))).toHaveLength(120);
  });
});

describe('CBM row helpers', () => {
  it('moves one item and keeps the rest in order', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });

  it('converts weight per package exactly between kg, g and lb', () => {
    expect(withWeightUnit({ weightPerItem: '2', weightUnit: 'kg' }, 'g')).toEqual({
      weightPerItem: '2000',
      weightUnit: 'g',
    });
    expect(withWeightUnit({ weightPerItem: '0.45359237', weightUnit: 'kg' }, 'lb')).toEqual({
      weightPerItem: '1',
      weightUnit: 'lb',
    });
    expect(withWeightUnit({ weightPerItem: '', weightUnit: 'kg' }, 'lb').weightPerItem).toBe('');
  });
});
