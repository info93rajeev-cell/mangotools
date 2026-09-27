import { defineOperation, err, ok } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { buildRowTable, isJsonToCsvFailure } from './rows.ts';
import { jsonToCsvInput, jsonToCsvOutput, jsonToCsvParams } from './schema.ts';
import { buildCsv } from './stringify.ts';

const FAILURE_CODE = {
  'root-invalid': 'DATA_JSON_TO_CSV_ROOT_INVALID',
  'empty-array': 'DATA_JSON_TO_CSV_EMPTY_ARRAY',
  'no-columns': 'DATA_JSON_TO_CSV_NO_COLUMNS',
} as const;

export const jsonToCsv = defineOperation({
  id: 'data.json.to-csv',
  major: 1,
  title: 'Convert JSON to CSV',
  summary: 'Converts a JSON array of objects, or a single object, into CSV text.',
  input: jsonToCsvInput,
  params: jsonToCsvParams,
  output: jsonToCsvOutput,
  errors: [
    'DATA_JSON_TO_CSV_EMPTY',
    'DATA_JSON_TO_CSV_INVALID_JSON',
    'DATA_JSON_TO_CSV_ROOT_INVALID',
    'DATA_JSON_TO_CSV_EMPTY_ARRAY',
    'DATA_JSON_TO_CSV_ITEM_NOT_OBJECT',
    'DATA_JSON_TO_CSV_NESTED_VALUE',
    'DATA_JSON_TO_CSV_NO_COLUMNS',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    if (input.text.trim() === '') return err('DATA_JSON_TO_CSV_EMPTY', { path: 'text' });

    let value: unknown;
    try {
      value = JSON.parse(input.text);
    } catch {
      return err('DATA_JSON_TO_CSV_INVALID_JSON', { path: 'text' });
    }

    let table: ReturnType<typeof buildRowTable>;
    try {
      table = buildRowTable(value);
    } catch (e) {
      if (!isJsonToCsvFailure(e)) throw e;
      if (e.tag === 'item-not-object') {
        return err('DATA_JSON_TO_CSV_ITEM_NOT_OBJECT', { path: 'text', details: { item: e.item } });
      }
      if (e.tag === 'nested-value') {
        return err('DATA_JSON_TO_CSV_NESTED_VALUE', {
          path: 'text',
          details: { item: e.item, key: e.key },
        });
      }
      return err(FAILURE_CODE[e.tag], { path: 'text' });
    }

    return ok({
      text: buildCsv(table.headers, table.rows),
      rowCount: table.rows.length,
      columnCount: table.headers.length,
      headers: table.headers,
    });
  },
});
