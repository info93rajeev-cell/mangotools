import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { csvToJson } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(csvToJson, { text }, params, createTestContext());

describe('data.csv.to-json', () => {
  it('keeps every value a string, never inferring numbers or booleans', async () => {
    const result = await run('id,active,price\n1,true,9.50\n');
    expect(result.ok && JSON.parse(result.value.text)).toEqual([
      { id: '1', active: 'true', price: '9.50' },
    ]);
  });

  it('reports row count, column count and header names', async () => {
    const result = await run('a,b,c\n1,2,3\n4,5,6\n');
    expect(result.ok && result.value.rowCount).toBe(2);
    expect(result.ok && result.value.columnCount).toBe(3);
    expect(result.ok && result.value.headers).toEqual(['a', 'b', 'c']);
  });

  it('removes a byte order mark with a warning', async () => {
    const result = await run('﻿name\nRaj\n');
    expect(result.ok && JSON.parse(result.value.text)).toEqual([{ name: 'Raj' }]);
    expect(result.ok && result.warnings.map((w) => w.code)).toEqual(['DATA_CSV_BOM_REMOVED']);
  });

  it('minifies to a single line when pretty is off', async () => {
    const result = await run('a,b\n1,2\n', { pretty: false });
    expect(result.ok && result.value.text).toBe('[{"a":"1","b":"2"}]');
  });

  it('rejects blank or whitespace-only input', async () => {
    const result = await run('   \n  ');
    expect(!result.ok && result.error.code).toBe('DATA_CSV_EMPTY');
  });

  it('treats a lone CR as a line ending too, in addition to CRLF and LF', async () => {
    const result = await run('a,b\r1,2\r');
    expect(result.ok && JSON.parse(result.value.text)).toEqual([{ a: '1', b: '2' }]);
  });
});
