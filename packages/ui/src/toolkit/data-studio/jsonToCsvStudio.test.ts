import { describe, expect, it } from 'vitest';
import {
  type JsonToCsvResult,
  pathLabel,
  readJsonToCsvResult,
  rootDescription,
  rootKind,
  summaryNote,
} from './jsonToCsvStudio.ts';

const base: JsonToCsvResult = {
  text: 'a\n1\n',
  rowCount: 1,
  columnCount: 1,
  headers: ['a'],
  missingCount: 0,
  formulaCount: 0,
  leadingZeroColumns: [],
  recordPaths: [''],
  previewRows: [['1']],
};

describe('jsonToCsvStudio helpers', () => {
  it('reads an engine result and ignores a missing one', () => {
    expect(readJsonToCsvResult(undefined)).toBeNull();
    expect(readJsonToCsvResult({ ...base })).toEqual(base);
    expect(readJsonToCsvResult({ text: 'x' })?.previewRows).toEqual([]);
  });

  it('labels record paths JSONPath style', () => {
    expect(pathLabel('', true)).toBe('$[*]');
    expect(pathLabel('', false)).toBe('$');
    expect(pathLabel('data.items', true)).toBe('$.data.items[*]');
  });

  it('describes the root', () => {
    expect(rootKind('  [1]')).toBe('array');
    expect(rootKind('{"a":1}')).toBe('object');
    expect(rootKind('x')).toBeNull();
    expect(rootDescription('array', '')).toBe('Array of objects');
    expect(rootDescription('object', 'orders')).toBe('Records at orders');
  });

  it('chooses the summary note', () => {
    expect(summaryNote({ ...base, leadingZeroColumns: ['sku'] }, false)).toBe(
      'sku values with leading zeros remain text.',
    );
    expect(summaryNote({ ...base, formulaCount: 2 }, false)).toContain('Turn on the formula guard');
    expect(summaryNote({ ...base, formulaCount: 1 }, true)).toContain(
      '1 formula-like cell prefixed',
    );
    expect(summaryNote(base, false)).toBe('Values are written as they appear in the JSON.');
  });
});
