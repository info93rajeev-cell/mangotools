import { describe, expect, it } from 'vitest';
import { convertOpeningsText, readOpeningRows, writeOpeningRows } from './openingRows.ts';

describe('opening rows', () => {
  it('keeps an existing untyped opening generic', () => {
    const raw = '[{"width":"0.9","height":"2.1","quantity":"1"}]';

    expect(readOpeningRows(raw)).toEqual([
      { type: '', width: '0.9', height: '2.1', quantity: '1' },
    ]);
    expect(JSON.parse(writeOpeningRows(readOpeningRows(raw)))).toEqual([
      { width: '0.9', height: '2.1', quantity: '1' },
    ]);
  });

  it('round-trips semantic opening types through the form value', () => {
    const rows = [
      { type: 'door', width: '0.9', height: '2.1', quantity: '1' },
      { type: 'window', width: '1.2', height: '1.2', quantity: '2' },
    ];

    expect(readOpeningRows(writeOpeningRows(rows))).toEqual(rows);
  });

  it('preserves type while converting opening dimensions', () => {
    const raw = writeOpeningRows([{ type: 'other', width: '1', height: '2', quantity: '1' }]);

    expect(readOpeningRows(convertOpeningsText(raw, 'm', 'cm'))).toEqual([
      { type: 'other', width: '100', height: '200', quantity: '1' },
    ]);
  });
});
