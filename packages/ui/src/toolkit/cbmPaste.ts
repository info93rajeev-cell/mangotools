/**
 * Reads a block pasted from a spreadsheet (tab-separated, or CSV) into worksheet cells. Pure and
 * local: the text never leaves the browser, and only numeric fields ever reach the engine.
 */
export const PASTE_COLUMNS = [
  'description',
  'length',
  'width',
  'height',
  'quantity',
  'weightPerItem',
] as const;
export type PasteField = (typeof PASTE_COLUMNS)[number];

/** Spreadsheet copies are tab-separated; otherwise CSV, or semicolons where they dominate. */
function delimiterOf(source: string): string {
  if (source.includes('\t')) return '\t';
  const firstLine = source.split('\n').find((line) => line.trim()) ?? '';
  const count = (mark: string) => firstLine.split(mark).length - 1;
  return count(';') > count(',') ? ';' : ',';
}

interface Cursor {
  rows: string[][];
  row: string[];
  cell: string;
  quoted: boolean;
}
function endCell(cursor: Cursor, endRow: boolean) {
  cursor.row.push(cursor.cell);
  cursor.cell = '';
  if (!endRow) return;
  cursor.rows.push(cursor.row);
  cursor.row = [];
}
/** Reads inside quotes; returns how many characters were consumed ("" is a literal quote). */
function readQuoted(cursor: Cursor, char: string, next: string | undefined): number {
  if (char !== '"') cursor.cell += char;
  else if (next === '"') cursor.cell += '"';
  else cursor.quoted = false;
  return char === '"' && next === '"' ? 2 : 1;
}
function readPlain(cursor: Cursor, char: string, delimiter: string) {
  if (char === '"' && !cursor.cell) cursor.quoted = true;
  else if (char === delimiter) endCell(cursor, false);
  else if (char === '\n') endCell(cursor, true);
  else cursor.cell += char;
}

/** Splits tab-separated (spreadsheet copy), CSV or semicolon text, with RFC 4180 quoting. */
export function parseGrid(text: string): string[][] {
  const source = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const delimiter = delimiterOf(source);
  const cursor: Cursor = { rows: [], row: [], cell: '', quoted: false };
  let index = 0;
  while (index < source.length) {
    const char = source[index] ?? '';
    if (cursor.quoted) index += readQuoted(cursor, char, source[index + 1]);
    else {
      readPlain(cursor, char, delimiter);
      index++;
    }
  }
  if (cursor.cell || cursor.row.length) endCell(cursor, true);
  return cursor.rows.filter((cells) => cells.some((value) => value.trim()));
}

/** True for a block of more than one cell; a single value pastes into the field as usual. */
export const isBlock = (text: string) => /[\t\n]/.test(text.replace(/\r?\n$/, ''));

const HEADER = /desc|sku|item|name|length|width|height|qty|quantity|weight|pcs|pieces/i;
/** A first row of labels (for example the copied header row) is not pasted as data. */
export function withoutHeader(grid: string[][]): string[][] {
  const first = grid[0] ?? [];
  const labels = first.filter((cell) => HEADER.test(cell)).length;
  const numbers = first.filter((cell) => /^[\d.,\s]+$/.test(cell.trim()) && cell.trim()).length;
  return labels >= 2 && numbers === 0 ? grid.slice(1) : grid;
}

/** Normalises a spreadsheet number: "1,250" → "1250", "0.30000000000000004" → "0.3". */
export function cleanNumber(value: string): string {
  const text = value.trim().replace(/\s+/g, '');
  const grouped = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text) ? text.replace(/,/g, '') : text;
  const noisy = /^(\d+)\.(\d{11,})$/.exec(grouped);
  if (!noisy) return grouped.slice(0, 64);
  const [, whole = '0', fraction = ''] = noisy;
  const up = (fraction[10] ?? '0') >= '5' ? 1n : 0n;
  const digits = (BigInt(`${whole}${fraction.slice(0, 10)}`) + up).toString().padStart(11, '0');
  return `${digits.slice(0, -10)}.${digits.slice(-10)}`.replace(/\.?0+$/, '');
}

/** The cell value a pasted string becomes for one worksheet field. */
export const pastedValue = (field: PasteField, value: string) =>
  field === 'description' ? value.trim().slice(0, 120) : cleanNumber(value);
