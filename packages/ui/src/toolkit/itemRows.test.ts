import { describe, expect, it } from 'vitest';
import { normalizeRowNumberText, parseRowError, parseRows, serializeRows } from './itemRows.ts';

const FIELDS = ['description', 'quantity', 'unit'] as const;
const DEFAULTS = { description: '', quantity: '', unit: 'PCS' };
const NUMERIC = new Set(['quantity']);

describe('parseRows', () => {
  it('returns one default row for an empty string (the initial/reset state)', () => {
    expect(parseRows('', FIELDS, DEFAULTS)).toEqual([DEFAULTS]);
  });

  it('returns one default row for malformed JSON, without throwing', () => {
    expect(parseRows('not json', FIELDS, DEFAULTS)).toEqual([DEFAULTS]);
  });

  it('returns one default row for an empty array', () => {
    expect(parseRows('[]', FIELDS, DEFAULTS)).toEqual([DEFAULTS]);
  });

  it('round-trips a row written by serializeRows', () => {
    const rows = [{ description: 'Widget', quantity: '5', unit: 'KG' }];
    expect(parseRows(serializeRows(rows, FIELDS, NUMERIC), FIELDS, DEFAULTS)).toEqual(rows);
  });

  it('falls back to each field default when missing, not just the whole row', () => {
    const [row] = parseRows(JSON.stringify([{ description: 'Widget' }]), FIELDS, DEFAULTS);
    expect(row).toEqual({ description: 'Widget', quantity: '', unit: 'PCS' });
  });

  it('only reads the fields it is told about, ignoring extra keys', () => {
    const [row] = parseRows(JSON.stringify([{ description: 'W', hsn: '1234' }]), FIELDS, DEFAULTS);
    expect(row).not.toHaveProperty('hsn');
  });
});

describe('serializeRows', () => {
  it('omits blank fields entirely rather than sending empty strings', () => {
    const parsed = JSON.parse(
      serializeRows([{ description: 'W', quantity: '', unit: '' }], FIELDS, NUMERIC),
    );
    expect(parsed[0]).toEqual({ description: 'W' });
  });

  it('strips grouping and symbols from numeric fields only', () => {
    const parsed = JSON.parse(
      serializeRows([{ description: '1,000', quantity: '1,000', unit: 'PCS' }], FIELDS, NUMERIC),
    );
    expect(parsed[0].description).toBe('1,000');
    expect(parsed[0].quantity).toBe('1000');
  });
});

describe('normalizeRowNumberText', () => {
  it('strips whitespace, grouping commas, underscores, rupee signs and percent signs', () => {
    expect(normalizeRowNumberText('₹1,00,000_50 %')).toBe('10000050');
  });
});

describe('parseRowError', () => {
  it('maps an "items[N].field" path to its row index and field when the field is allowed', () => {
    expect(parseRowError('items[2].quantity', FIELDS)).toEqual({ index: 2, field: 'quantity' });
  });

  it('returns null for a field not in the allow-list', () => {
    expect(parseRowError('items[0].unitPrice', FIELDS)).toBeNull();
  });

  it('returns null for a whole-array error (no row index)', () => {
    expect(parseRowError('items', FIELDS)).toBeNull();
  });

  it('returns null for an unrelated field path', () => {
    expect(parseRowError('exporterName', FIELDS)).toBeNull();
  });

  it('returns null when there is no path at all', () => {
    expect(parseRowError(undefined, FIELDS)).toBeNull();
  });
});
