import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { jsonToCsv } from './operation.ts';
import { escapeCsvField } from './stringify.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(jsonToCsv, { text }, params, createTestContext());

describe('data.json.to-csv options', () => {
  it('keeps the previous output when no params are given', async () => {
    const result = await run('[{"a":"x"}]');
    expect(result.ok && result.value.text).toBe('a\nx\n');
    expect(result.ok && result.value.missingCount).toBe(0);
    expect(result.ok && result.value.formulaCount).toBe(0);
  });

  it('writes tab-separated values and quotes a value containing a tab', async () => {
    const result = await run('[{"a":"x\\ty","b":"z"}]', { delimiter: 'tab' });
    expect(result.ok && result.value.text).toBe('a\tb\n"x\ty"\tz\n');
  });

  it('writes pipe-separated values', async () => {
    const result = await run('[{"a":"1","b":"2|3"}]', { delimiter: 'pipe' });
    expect(result.ok && result.value.text).toBe('a|b\n1|"2|3"\n');
  });

  it('leaves a comma unquoted when the delimiter is a semicolon', async () => {
    const result = await run('[{"amount":"1,5"}]', { delimiter: 'semicolon' });
    expect(result.ok && result.value.text).toBe('amount\n1,5\n');
  });

  it('flattens an empty object to JSON text in its own column', async () => {
    const result = await run('[{"a":{}}]', { nested: 'flatten' });
    expect(result.ok && result.value.text).toBe('a\n{}\n');
  });

  it('lets the first value win when a literal dotted key meets a flattened path', async () => {
    const result = await run('[{"a.b":"literal","a":{"b":"nested"}}]', { nested: 'flatten' });
    expect(result.ok && result.value.headers).toEqual(['a.b']);
    expect(result.ok && result.value.text).toBe('a.b\nliteral\n');
  });

  it('still rejects nested values by default', async () => {
    const result = await run('[{"a":{"b":1}}]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_NESTED_VALUE');
  });

  it('counts a missing key but not a null value', async () => {
    const result = await run('[{"a":1,"b":null},{"a":2}]');
    expect(result.ok && result.value.missingCount).toBe(1);
  });

  it('counts formula-like text without changing it when the guard is off', async () => {
    const result = await run('[{"a":"@cmd","b":"+1","c":"plain"}]');
    expect(result.ok && result.value.formulaCount).toBe(2);
    expect(result.ok && result.value.text).toBe('a,b,c\n@cmd,+1,plain\n');
  });

  it('never guards a JSON number, only text', async () => {
    const result = await run('[{"n":-5}]', { formulaGuard: true });
    expect(result.ok && result.value.text).toBe('n\n-5\n');
    expect(result.ok && result.value.formulaCount).toBe(0);
  });

  it('reports leading-zero text columns but not decimals or numbers', async () => {
    const result = await run('[{"sku":"00124","price":"0.50","qty":7,"pin":"0042"}]');
    expect(result.ok && result.value.leadingZeroColumns).toEqual(['sku', 'pin']);
  });

  it('lists the root and nested record arrays as record paths', async () => {
    const result = await run('{"a":{"b":[{"x":1}]},"c":[1,2],"d":[{"y":2}]}', {
      recordPath: 'd',
    });
    expect(result.ok && result.value.recordPaths).toEqual(['', 'a.b', 'd']);
    expect(result.ok && result.value.text).toBe('y\n2\n');
  });

  it('reports a record path that leads to a scalar as a root error', async () => {
    const result = await run('{"a":{"b":5}}', { recordPath: 'a.b' });
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_ROOT_INVALID');
  });

  it('rejects a record path with spaces in its params', async () => {
    const result = await run('[{"a":1}]', { recordPath: 'a b' });
    expect(result.ok).toBe(false);
  });

  it('escapes with a given delimiter', () => {
    expect(escapeCsvField('a;b', ';')).toBe('"a;b"');
    expect(escapeCsvField('a;b')).toBe('a;b');
  });
});
