import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { DELIMITER_CHAR, resolveDelimiter } from './delimiter.ts';
import { isCsvSyntaxFailure, tokenizeCsv } from './parse.ts';
import { renderJson } from './render.ts';
import { csvToJsonInput, csvToJsonOutput, csvToJsonParams } from './schema.ts';
import { selectColumns } from './select.ts';
import { buildCsvTable, type CsvTable, isCsvTableFailure } from './table.ts';

const SYNTAX_CODE = {
  'unclosed-quote': 'DATA_CSV_UNCLOSED_QUOTE',
  'invalid-quote': 'DATA_CSV_INVALID_QUOTE',
} as const;

function tableError(e: unknown) {
  if (isCsvSyntaxFailure(e) && (e.tag === 'unclosed-quote' || e.tag === 'invalid-quote')) {
    return err(SYNTAX_CODE[e.tag], { path: 'text', details: { line: e.line } });
  }
  if (!isCsvTableFailure(e)) throw e;
  if (e.tag === 'no-header') return err('DATA_CSV_NO_HEADER_ROW', { path: 'text' });
  if (e.tag === 'duplicate-header') {
    return err('DATA_CSV_DUPLICATE_HEADER', {
      path: 'text',
      details: { name: e.name, column: e.column, line: e.line },
    });
  }
  return err('DATA_CSV_INCONSISTENT_COLUMNS', {
    path: 'text',
    details: { line: e.line, expected: e.expected, actual: e.actual },
  });
}

export const csvToJson = defineOperation({
  id: 'data.csv.to-json',
  major: 1,
  title: 'Convert CSV to JSON',
  summary: 'Converts CSV text into a JSON array of objects, using the first row as headers.',
  input: csvToJsonInput,
  params: csvToJsonParams,
  output: csvToJsonOutput,
  errors: [
    'DATA_CSV_EMPTY',
    'DATA_CSV_NO_HEADER_ROW',
    'DATA_CSV_DUPLICATE_HEADER',
    'DATA_CSV_INCONSISTENT_COLUMNS',
    'DATA_CSV_UNCLOSED_QUOTE',
    'DATA_CSV_INVALID_QUOTE',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    const warnings: OpWarning[] = [];
    let text = input.text;
    if (text.startsWith('﻿')) {
      text = text.slice(1);
      warnings.push(warning('DATA_CSV_BOM_REMOVED'));
    }
    if (text.trim() === '') return err('DATA_CSV_EMPTY', { path: 'text' });

    const delimiter = resolveDelimiter(params.delimiter, text);
    let table: CsvTable;
    try {
      table = buildCsvTable(tokenizeCsv(text, DELIMITER_CHAR[delimiter]), params);
    } catch (e) {
      return tableError(e);
    }

    const selected = selectColumns(table, params);
    if (selected.truncated)
      warnings.push(warning('DATA_CSV_ROWS_LIMITED', { details: selected.truncated }));
    const jsonText = renderJson(selected.headers, selected.rows, {
      ...params,
      headerRow: params.header,
    });
    return ok(
      {
        text: jsonText,
        rowCount: selected.rows.length,
        columnCount: selected.headers.length,
        headers: selected.headers,
        columns: selected.columns,
        delimiter,
        sourceRowCount: table.rows.length,
      },
      warnings,
    );
  },
});
