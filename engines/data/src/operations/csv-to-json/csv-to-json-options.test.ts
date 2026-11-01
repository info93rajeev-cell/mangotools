import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { csvToJson } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(csvToJson, { text }, params, createTestContext());

const parsed = async (text: string, params: Record<string, unknown> = {}) => {
  const result = await run(text, params);
  if (!result.ok) throw new Error(result.error.code);
  return { value: result.value, json: JSON.parse(result.value.text) as unknown };
};

describe('data.csv.to-json options', () => {
  it('reports column types as string when inference is off (the default)', async () => {
    const { value } = await parsed('id,ok\n1,true\n');
    expect(value.columns.map((c) => c.type)).toEqual(['string', 'string']);
    expect(value.delimiter).toBe('comma');
  });

  it('infers numbers and booleans only when lossless', async () => {
    const csv = 'a,b,c,d,e,f,g\n30,true,00124,1.50,9007199254740993,-2.5,FALSE\n';
    const { json, value } = await parsed(csv, { inferTypes: true });
    expect(json).toEqual([
      { a: 30, b: true, c: '00124', d: '1.50', e: '9007199254740993', f: -2.5, g: false },
    ]);
    expect(value.columns.map((c) => c.type)).toEqual([
      'number',
      'boolean',
      'string',
      'string',
      'string',
      'number',
      'boolean',
    ]);
  });

  it('marks a column mixed when its values have different types', async () => {
    const { value } = await parsed('v\n1\nx\n', { inferTypes: true });
    expect(value.columns[0].type).toBe('mixed');
  });

  it('writes empty values and custom tokens as null', async () => {
    const { json, value } = await parsed('a,b\n,NA\n', {
      emptyAsNull: true,
      nullValues: 'NA, N/A',
    });
    expect(json).toEqual([{ a: null, b: null }]);
    expect(value.columns[0].type).toBe('null');
  });

  it('detects semicolon, tab and pipe with delimiter auto', async () => {
    for (const [sep, name] of [
      [';', 'semicolon'],
      ['\t', 'tab'],
      ['|', 'pipe'],
    ] as const) {
      const { json, value } = await parsed(`a${sep}b\n1${sep}"x${sep}y"\n`, { delimiter: 'auto' });
      expect(value.delimiter).toBe(name);
      expect(json).toEqual([{ a: '1', b: `x${sep}y` }]);
    }
  });

  it('names columns column_1… when the first row is data', async () => {
    const { json, value } = await parsed('1,2\n3,4\n', { header: false });
    expect(json).toEqual([
      { column_1: '1', column_2: '2' },
      { column_1: '3', column_2: '4' },
    ]);
    expect(value.rowCount).toBe(2);
  });

  it('trims spaces and skips rows that are all empty', async () => {
    const { json } = await parsed(' a , b \n 1 , 2 \n , \n', { trim: true, skipEmptyRows: true });
    expect(json).toEqual([{ a: '1', b: '2' }]);
  });

  it('limits rows with a warning and keeps the source count', async () => {
    const result = await run('a\n1\n2\n3\n', { maxRows: '2' });
    expect(result.ok && result.value.rowCount).toBe(2);
    expect(result.ok && result.value.sourceRowCount).toBe(3);
    expect(result.ok && result.warnings.map((w) => w.code)).toEqual(['DATA_CSV_ROWS_LIMITED']);
  });

  it('leaves excluded columns out but still reports them', async () => {
    const { json, value } = await parsed('a,b,c\n1,2,3\n', { excludeColumns: '2' });
    expect(json).toEqual([{ a: '1', c: '3' }]);
    expect(value.columns.map((c) => c.included)).toEqual([true, false, true]);
    expect(value.columnCount).toBe(2);
  });

  it('renders arrays, NDJSON and a metadata wrapper', async () => {
    const arrays = await parsed('a,b\n1,2\n', { shape: 'arrays', pretty: false });
    expect(arrays.value.text).toBe('[["a","b"],["1","2"]]');
    const ndjson = await run('a\n1\n2\n', { shape: 'ndjson' });
    expect(ndjson.ok && ndjson.value.text).toBe('{"a":"1"}\n{"a":"2"}');
    const meta = await parsed('a\n1\n', { metadata: true });
    expect(meta.json).toEqual({
      meta: { rowCount: 1, columnCount: 1, columns: ['a'] },
      data: [{ a: '1' }],
    });
  });

  it('keeps a __proto__ header as an ordinary key', async () => {
    const { value } = await parsed('__proto__\nx\n', { pretty: false });
    expect(value.text).toBe('[{"__proto__":"x"}]');
  });
});
