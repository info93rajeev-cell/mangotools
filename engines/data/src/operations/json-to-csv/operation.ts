import { defineOperation, err, ok, type Result } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { findRecordPaths, valueAtPath } from './records.ts';
import { buildRowTable, isJsonToCsvFailure, type JsonRowTable } from './rows.ts';
import {
  type JsonToCsvOutput,
  type JsonToCsvParams,
  jsonToCsvInput,
  jsonToCsvOutput,
  jsonToCsvParams,
} from './schema.ts';
import { tableStats } from './stats.ts';
import { buildCsv } from './stringify.ts';

const FAILURE_CODE = {
  'root-invalid': 'DATA_JSON_TO_CSV_ROOT_INVALID',
  'empty-array': 'DATA_JSON_TO_CSV_EMPTY_ARRAY',
  'no-columns': 'DATA_JSON_TO_CSV_NO_COLUMNS',
} as const;

function parseJson(text: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}

/** The row table, or the typed error for the records value. */
function tableOrError(records: unknown, params: JsonToCsvParams): Result<JsonRowTable> {
  try {
    return ok(buildRowTable(records, params));
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
}

function convert(root: unknown, params: JsonToCsvParams): Result<JsonToCsvOutput> {
  const records = valueAtPath(root, params.recordPath);
  if (records === undefined) {
    return err('DATA_JSON_TO_CSV_RECORD_PATH_NOT_FOUND', {
      path: 'recordPath',
      details: { recordPath: params.recordPath },
    });
  }
  const table = tableOrError(records, params);
  if (!table.ok) return table;
  const { headers, rows } = table.value;
  return ok({
    text: buildCsv(headers, rows, params),
    rowCount: rows.length,
    columnCount: headers.length,
    headers,
    ...tableStats(table.value),
    recordPaths: findRecordPaths(root),
  });
}

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
    'DATA_JSON_TO_CSV_RECORD_PATH_NOT_FOUND',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    if (input.text.trim() === '') return err('DATA_JSON_TO_CSV_EMPTY', { path: 'text' });
    const parsed = parseJson(input.text);
    if (!parsed) return err('DATA_JSON_TO_CSV_INVALID_JSON', { path: 'text' });
    return convert(parsed.value, params);
  },
});
