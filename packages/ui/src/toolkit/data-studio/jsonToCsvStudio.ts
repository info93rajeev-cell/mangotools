/** Pure helpers for the JSON to CSV studio. The engine does all conversion. */

export type JsonToCsvDelimiter = 'comma' | 'semicolon' | 'tab' | 'pipe';
export type JsonToCsvNested = 'flatten' | 'json' | 'reject';

export interface JsonToCsvResult {
  text: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  missingCount: number;
  formulaCount: number;
  leadingZeroColumns: string[];
  recordPaths: string[];
  previewRows: string[][];
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

export function readJsonToCsvResult(
  value: Record<string, unknown> | undefined,
): JsonToCsvResult | null {
  if (!value || typeof value.text !== 'string') return null;
  const rows = Array.isArray(value.previewRows) ? value.previewRows : [];
  return {
    text: value.text,
    rowCount: Number(value.rowCount ?? 0),
    columnCount: Number(value.columnCount ?? 0),
    headers: strings(value.headers),
    missingCount: Number(value.missingCount ?? 0),
    formulaCount: Number(value.formulaCount ?? 0),
    leadingZeroColumns: strings(value.leadingZeroColumns),
    recordPaths: strings(value.recordPaths),
    previewRows: rows.map(strings),
  };
}

export const DELIMITER_LABEL: Readonly<Record<JsonToCsvDelimiter, string>> = {
  comma: 'Comma (,)',
  semicolon: 'Semicolon (;)',
  tab: 'Tab',
  pipe: 'Pipe (|)',
};

export const NESTED_LABEL: Readonly<Record<JsonToCsvNested, string>> = {
  flatten: 'Flatten with dot paths',
  json: 'Keep as JSON text',
  reject: 'Stop with an error',
};

/** A record path as JSONPath-style text: "" → $[*], "data.items" → $.data.items[*]. */
export function pathLabel(path: string, rootIsArray: boolean): string {
  if (path === '') return rootIsArray ? '$[*]' : '$';
  return `$.${path}[*]`;
}

/** "array" for a JSON array root, "object" for an object root, null when not JSON. */
export function rootKind(text: string): 'array' | 'object' | null {
  const first = text.trimStart()[0];
  if (first === '[') return 'array';
  if (first === '{') return 'object';
  return null;
}

export function rootDescription(kind: 'array' | 'object' | null, path: string): string {
  if (path !== '') return `Records at ${path}`;
  if (kind === 'array') return 'Array of objects';
  if (kind === 'object') return 'Single object';
  return 'Not JSON yet';
}

/** The note under the export summary: leading zeros, formula-like cells, or a neutral line. */
export function summaryNote(result: JsonToCsvResult, guard: boolean): string {
  const zeros = result.leadingZeroColumns;
  if (zeros.length > 0) {
    const names =
      zeros.length > 2 ? `${zeros.slice(0, 2).join(', ')} and others` : zeros.join(', ');
    return `${names} values with leading zeros remain text.`;
  }
  if (result.formulaCount > 0) {
    const n = result.formulaCount;
    return guard
      ? `${n} formula-like cell${n === 1 ? '' : 's'} prefixed with ' so spreadsheets show text.`
      : `${n} cell${n === 1 ? ' starts' : 's start'} like a formula. Turn on the formula guard.`;
  }
  return 'Values are written as they appear in the JSON.';
}

/** Byte-order mark that helps Excel open a UTF-8 CSV with the right characters. */
export const UTF8_BOM = '﻿';
