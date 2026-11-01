import { describe, expect, it } from 'vitest';
import {
  type CsvResult,
  countColumnTypes,
  formatBytes,
  previewTable,
  readCsvResult,
  toggleExcluded,
} from './csvToJsonResult.ts';

const base: CsvResult = {
  text: '[{"a":"1","b":2}]',
  rowCount: 1,
  columnCount: 2,
  headers: ['a', 'b'],
  columns: [
    { name: 'a', type: 'string', sample: '1', included: true },
    { name: 'b', type: 'number', sample: '2', included: true },
    { name: 'c', type: 'string', sample: 'x', included: false },
  ],
  delimiter: 'comma',
  sourceRowCount: 1,
};

describe('csvToJsonResult', () => {
  it('reads an older result without the new fields', () => {
    const r = readCsvResult({ text: '[]', rowCount: 0, columnCount: 1, headers: ['a'] });
    expect(r?.columns).toEqual([]);
    expect(r?.delimiter).toBe('comma');
    expect(readCsvResult(undefined)).toBeNull();
  });

  it('builds a preview table for every shape', () => {
    expect(previewTable(base, 'objects').rows).toEqual([['1', '2']]);
    const arrays = { ...base, text: '[["a","b"],["1",2]]' };
    expect(previewTable(arrays, 'arrays').rows).toEqual([['1', '2']]);
    const nd = { ...base, text: '{"a":"1","b":null}' };
    expect(previewTable(nd, 'ndjson').rows).toEqual([['1', 'null']]);
    const meta = { ...base, text: '{"meta":{},"data":[{"a":"x","b":1}]}' };
    expect(previewTable(meta, 'objects').rows).toEqual([['x', '1']]);
  });

  it('counts only included columns', () => {
    expect(countColumnTypes(base.columns)).toEqual({
      string: 1,
      number: 1,
      boolean: 0,
      null: 0,
      mixed: 0,
    });
  });

  it('toggles 1-based excluded columns', () => {
    expect(toggleExcluded('', 1, false)).toBe('2');
    expect(toggleExcluded('2,5', 4, true)).toBe('2');
    expect(toggleExcluded('3', 0, false)).toBe('1,3');
  });

  it('formats sizes', () => {
    expect(formatBytes(623)).toBe('623 bytes');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});
