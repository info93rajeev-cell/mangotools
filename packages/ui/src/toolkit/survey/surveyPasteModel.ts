import { surveyStrings } from './surveyLevelingStrings.ts';
import type { SurveyLevelingRow } from './surveyLevelingTypes.ts';

export type PasteTag = 'BM' | 'IS' | 'CP' | 'FS' | 'ERR';

export interface ParsedPasteRow {
  row: SurveyLevelingRow;
  tag: PasteTag;
  errors: string[];
}

export interface PasteParseSummary {
  total: number;
  bmCount: number;
  cpCount: number;
  isCount: number;
  fsCount: number;
  errorCount: number;
}

export interface PasteParseOutcome {
  rows: SurveyLevelingRow[];
  rowDetails: ParsedPasteRow[];
  hasHeader: boolean;
  headerLabels: string[];
  summary: PasteParseSummary;
  isValid: boolean;
  globalError?: string;
}

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

export function parseGrid(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
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
  return cursor.rows.filter((cells) => cells.some((val) => val.trim() !== ''));
}

const HEADER_PATTERNS: Record<string, RegExp> = {
  station: /^(station|stn\.?|point|pt\.?|name|#)$/i,
  bs: /^(bs\.?|backsight|back\s*sight|back|b\.s\.)$/i,
  is: /^(is\.?|inter|intermediate|inter\s*sight|intermediate\s*sight|i\.s\.)$/i,
  fs: /^(fs\.?|fore|foresight|fore\s*sight|f\.s\.)$/i,
  dist: /^(dist\.?|distance|dist\.?\s*\(m\)|distance\s*\(m\)|chainage)$/i,
  remarks: /^(remarks?|notes?|desc|description|comments?)$/i,
};

function matchHeaderCol(cell: string): string | null {
  const clean = cell.trim();
  if (!clean || /^-?\d+(\.\d+)?$/.test(clean)) return null;
  for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
    if (pattern.test(clean)) return key;
  }
  return null;
}

export function detectHeaderColumns(cells: string[]): {
  isHeader: boolean;
  mapping: Record<string, number>;
} {
  const mapping: Record<string, number> = {};
  let matchCount = 0;
  for (let i = 0; i < cells.length; i++) {
    const matched = matchHeaderCol(cells[i] ?? '');
    if (matched && mapping[matched] === undefined) {
      mapping[matched] = i;
      matchCount++;
    }
  }
  const isHeader = matchCount >= 2;
  return {
    isHeader,
    mapping: isHeader ? mapping : { station: 0, bs: 1, is: 2, fs: 3, dist: 4, remarks: 5 },
  };
}

export function cleanDecimal(raw: string): {
  clean: string;
  isValid: boolean;
  isNegative: boolean;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { clean: '', isValid: true, isNegative: false };
  const unquoted = trimmed.replace(/^"|"$/g, '');
  const uncomma = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(unquoted)
    ? unquoted.replace(/,/g, '')
    : unquoted;
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(uncomma)) {
    return { clean: uncomma, isValid: false, isNegative: false };
  }
  const frac = uncomma.split('.')[1] ?? '';
  if (frac.length > 6) {
    return { clean: uncomma, isValid: false, isNegative: false };
  }
  const isNegative = uncomma.startsWith('-');
  return { clean: uncomma, isValid: true, isNegative };
}

function mapRowCells(
  cells: string[],
  mapping: Record<string, number>,
  id: string,
): SurveyLevelingRow {
  const get = (key: string): string => {
    const idx = mapping[key];
    return idx !== undefined && idx < cells.length ? (cells[idx] ?? '').trim() : '';
  };
  return {
    id,
    station: get('station'),
    bs: cleanDecimal(get('bs')).clean,
    is: cleanDecimal(get('is')).clean,
    fs: cleanDecimal(get('fs')).clean,
    dist: cleanDecimal(get('dist')).clean,
    remarks: get('remarks'),
  };
}

function checkReadingField(val: string): string | null {
  if (!val) return null;
  const d = cleanDecimal(val);
  if (!d.isValid || d.isNegative) {
    return d.isNegative
      ? surveyStrings.pasteErrNegativeReading
      : surveyStrings.pasteErrInvalidReading;
  }
  return null;
}

function determineRowTag(
  hasBS: boolean,
  hasIS: boolean,
  hasFS: boolean,
): { tag: PasteTag; err?: string } {
  if (!hasBS && !hasIS && !hasFS) return { tag: 'ERR', err: surveyStrings.pasteErrEmpty };
  if (hasIS && (hasBS || hasFS)) return { tag: 'ERR', err: surveyStrings.pasteErrCombination };
  if (hasBS && hasFS) return { tag: 'CP' };
  if (hasBS) return { tag: 'BM' };
  if (hasFS) return { tag: 'FS' };
  return { tag: 'IS' };
}

function validateRowReadings(row: SurveyLevelingRow): { tag: PasteTag; errors: string[] } {
  const errors: string[] = [];
  const bsErr = checkReadingField(row.bs);
  if (bsErr) errors.push(bsErr);
  const isErr = checkReadingField(row.is);
  if (isErr) errors.push(isErr);
  const fsErr = checkReadingField(row.fs);
  if (fsErr) errors.push(fsErr);
  if (row.dist) {
    const distCheck = cleanDecimal(row.dist);
    if (!distCheck.isValid || distCheck.isNegative) errors.push(surveyStrings.pasteErrDist);
  }

  const { tag, err } = determineRowTag(
    row.bs.trim() !== '',
    row.is.trim() !== '',
    row.fs.trim() !== '',
  );
  if (err) errors.push(err);
  return { tag: errors.length ? 'ERR' : tag, errors };
}

function validateSequence(rowDetails: ParsedPasteRow[]): void {
  const total = rowDetails.length;
  if (total === 0) return;
  const first = rowDetails[0];
  if (first && first.row.bs.trim() === '') {
    first.errors.push(surveyStrings.pasteErrStartBS);
    first.tag = 'ERR';
  }
  if (first && first.row.dist.trim() !== '' && Number(first.row.dist) > 0) {
    first.errors.push(surveyStrings.pasteErrDistZero);
  }
  const last = rowDetails[total - 1];
  if (last && last.row.fs.trim() === '') {
    last.errors.push(surveyStrings.pasteErrEndFS);
    last.tag = 'ERR';
  }
  for (let i = 1; i < total - 1; i++) {
    const item = rowDetails[i];
    if (item && item.row.bs.trim() !== '' && item.row.fs.trim() === '') {
      item.errors.push(surveyStrings.pasteErrCP);
      item.tag = 'ERR';
    }
  }
}

function calculateSummary(rowDetails: ParsedPasteRow[]): PasteParseSummary {
  const summary: PasteParseSummary = {
    total: rowDetails.length,
    bmCount: 0,
    cpCount: 0,
    isCount: 0,
    fsCount: 0,
    errorCount: 0,
  };
  for (const item of rowDetails) {
    if (item.errors.length > 0) summary.errorCount++;
    if (item.tag === 'BM') summary.bmCount++;
    else if (item.tag === 'CP') summary.cpCount++;
    else if (item.tag === 'IS') summary.isCount++;
    else if (item.tag === 'FS') summary.fsCount++;
  }
  return summary;
}

export function parseSpreadsheetPaste(text: string): PasteParseOutcome {
  const grid = parseGrid(text);
  if (grid.length === 0) {
    return {
      rows: [],
      rowDetails: [],
      hasHeader: false,
      headerLabels: [],
      summary: { total: 0, bmCount: 0, cpCount: 0, isCount: 0, fsCount: 0, errorCount: 0 },
      isValid: false,
    };
  }
  const { isHeader, mapping } = detectHeaderColumns(grid[0] ?? []);
  const dataRows = isHeader ? grid.slice(1) : grid;
  const rowDetails: ParsedPasteRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = mapRowCells(dataRows[i] ?? [], mapping, `paste-row-${i + 1}`);
    const { tag, errors } = validateRowReadings(row);
    rowDetails.push({ row, tag, errors });
  }

  validateSequence(rowDetails);
  const summary = calculateSummary(rowDetails);

  let globalError: string | undefined;
  if (rowDetails.length < 2) {
    globalError = surveyStrings.pasteErrMinRows;
  } else if (rowDetails.length > 50) {
    globalError = surveyStrings.pasteErrMaxRows;
  }

  const isValid = !globalError && summary.errorCount === 0 && rowDetails.length >= 2;

  return {
    rows: rowDetails.map((d) => d.row),
    rowDetails,
    hasHeader: isHeader,
    headerLabels: isHeader ? (grid[0] ?? []) : [],
    summary,
    isValid,
    globalError,
  };
}
