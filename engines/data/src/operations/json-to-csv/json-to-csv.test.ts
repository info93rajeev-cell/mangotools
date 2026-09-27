import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { jsonToCsv } from './operation.ts';
import { escapeCsvField } from './stringify.ts';

const run = (text: string) => executeOperation(jsonToCsv, { text }, {}, createTestContext());

describe('data.json.to-csv', () => {
  it('converts a simple array of objects', async () => {
    const result = await run('[{"name":"Raj","age":"50"},{"name":"Aiva","age":"19"}]');
    expect(result.ok && result.value.text).toBe('name,age\nRaj,50\nAiva,19\n');
    expect(result.ok && result.value.rowCount).toBe(2);
    expect(result.ok && result.value.columnCount).toBe(2);
    expect(result.ok && result.value.headers).toEqual(['name', 'age']);
  });

  it('treats a single object as one row', async () => {
    const result = await run('{"name":"Raj","age":"50"}');
    expect(result.ok && result.value.text).toBe('name,age\nRaj,50\n');
    expect(result.ok && result.value.rowCount).toBe(1);
  });

  it('appends keys discovered in later objects, after the first object own order', async () => {
    const result = await run('[{"b":1,"a":2},{"a":3,"c":4}]');
    expect(result.ok && result.value.headers).toEqual(['b', 'a', 'c']);
    expect(result.ok && result.value.text).toBe('b,a,c\n1,2,\n,3,4\n');
  });

  it('fills a missing key with an empty cell', async () => {
    const result = await run('[{"a":1,"b":2},{"a":3}]');
    expect(result.ok && result.value.text).toBe('a,b\n1,2\n3,\n');
  });

  it('outputs null as an empty cell', async () => {
    const result = await run('[{"a":1,"b":null}]');
    expect(result.ok && result.value.text).toBe('a,b\n1,\n');
  });

  it('outputs numbers and booleans as their plain text form, unquoted', async () => {
    const result = await run('[{"n":1.5,"ok":true,"no":false}]');
    expect(result.ok && result.value.text).toBe('n,ok,no\n1.5,true,false\n');
  });

  it('quotes a value containing a comma', async () => {
    const result = await run('[{"note":"a,b"}]');
    expect(result.ok && result.value.text).toBe('note\n"a,b"\n');
  });

  it('quotes a value containing a double quote, doubling it', async () => {
    const result = await run('[{"note":"He said \\"yes\\""}]');
    expect(result.ok && result.value.text).toBe('note\n"He said ""yes"""\n');
  });

  it('quotes a value containing a newline', async () => {
    const result = await run('[{"note":"line1\\nline2"}]');
    expect(result.ok && result.value.text).toBe('note\n"line1\nline2"\n');
  });

  it('quotes a value with leading or trailing spaces', async () => {
    const result = await run('[{"note":" padded "}]');
    expect(result.ok && result.value.text).toBe('note\n" padded "\n');
  });

  it('rejects invalid JSON', async () => {
    const result = await run('{not json}');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_INVALID_JSON');
  });

  it('rejects empty input', async () => {
    const result = await run('   ');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_EMPTY');
  });

  it('rejects an empty array', async () => {
    const result = await run('[]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_EMPTY_ARRAY');
  });

  it('rejects a JSON root that is neither an array nor an object', async () => {
    const result = await run('"just a string"');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_ROOT_INVALID');
  });

  it('rejects an array item that is not an object, naming its position', async () => {
    const result = await run('[{"a":1}, 2]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_ITEM_NOT_OBJECT');
    expect(!result.ok && result.error.details).toEqual({ item: 2 });
  });

  it('rejects a nested object value, naming the key and item', async () => {
    const result = await run('[{"a":{"b":1}}]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_NESTED_VALUE');
    expect(!result.ok && result.error.details).toEqual({ item: 1, key: 'a' });
  });

  it('rejects a nested array value', async () => {
    const result = await run('[{"a":[1,2]}]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_NESTED_VALUE');
  });

  it('rejects objects with no properties at all', async () => {
    const result = await run('[{}, {}]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_NO_COLUMNS');
  });
});

describe('escapeCsvField', () => {
  it('leaves a plain value unquoted', () => {
    expect(escapeCsvField('plain')).toBe('plain');
  });

  it('leaves an empty value unquoted', () => {
    expect(escapeCsvField('')).toBe('');
  });
});
