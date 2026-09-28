import { describe, expect, it } from 'vitest';
import {
  emptyItemRow,
  invoiceTransferValues,
  parseItemRows,
  parseRowError,
  serializeItemRows,
} from './invoiceItems.ts';

describe('parseItemRows', () => {
  it('returns one blank row for an empty string (the initial/reset state)', () => {
    expect(parseItemRows('')).toEqual([emptyItemRow()]);
  });

  it('returns one blank row for malformed JSON, without throwing', () => {
    expect(parseItemRows('not json')).toEqual([emptyItemRow()]);
  });

  it('returns one blank row for an empty array', () => {
    expect(parseItemRows('[]')).toEqual([emptyItemRow()]);
  });

  it('round-trips a row written by serializeItemRows', () => {
    const rows = [{ ...emptyItemRow(), description: 'Cushion covers', quantity: '500' }];
    expect(parseItemRows(serializeItemRows(rows))).toEqual(rows);
  });

  it('defaults a missing unit to PCS and blanks every other missing field', () => {
    const [row] = parseItemRows(JSON.stringify([{ description: 'Widget' }]));
    expect(row).toEqual({ ...emptyItemRow(), description: 'Widget', unit: 'PCS' });
  });
});

describe('serializeItemRows', () => {
  it('omits blank optional fields entirely rather than sending empty strings', () => {
    const rows = [
      { ...emptyItemRow(), description: 'Widget', hsn: '630490', quantity: '1', unitPrice: '1' },
    ];
    const parsed = JSON.parse(serializeItemRows(rows));
    expect(parsed[0]).not.toHaveProperty('sku');
    expect(parsed[0]).not.toHaveProperty('countryOfOrigin');
    expect(parsed[0]).not.toHaveProperty('netWeight');
  });

  it('strips grouping and symbols from numeric fields, matching normal number fields', () => {
    const rows = [{ ...emptyItemRow(), quantity: '1,000', unitPrice: '₹5' }];
    const parsed = JSON.parse(serializeItemRows(rows));
    expect(parsed[0].quantity).toBe('1000');
    expect(parsed[0].unitPrice).toBe('5');
  });
});

describe('parseRowError', () => {
  it('maps an "items[N].field" path to its row index and field', () => {
    expect(parseRowError('items[2].quantity')).toEqual({ index: 2, field: 'quantity' });
  });

  it('returns null for a whole-array error (no row index)', () => {
    expect(parseRowError('items')).toBeNull();
  });

  it('returns null for an unrelated field path', () => {
    expect(parseRowError('exporterName')).toBeNull();
  });

  it('returns null for an unknown field name inside a well-formed path', () => {
    expect(parseRowError('items[0].bogus')).toBeNull();
  });

  it('returns null when there is no path at all', () => {
    expect(parseRowError(undefined)).toBeNull();
  });
});

describe('invoiceTransferValues', () => {
  it('passes every other tool\'s values through unchanged (no "items" key)', () => {
    const values = { exporterName: 'Acme', destinationCountry: 'India' };
    expect(invoiceTransferValues(values)).toBe(values);
  });

  it("supplies the single item's identity fields for a one-item invoice, unchanged from before TASK-009G", () => {
    const rows = [
      {
        ...emptyItemRow(),
        description: 'Cushion covers',
        sku: 'CC-1',
        unit: 'PCS',
        countryOfOrigin: 'India',
      },
    ];
    const values = { exporterName: 'Acme', items: serializeItemRows(rows) };
    const result = invoiceTransferValues(values);
    expect(result.itemDescription).toBe('Cushion covers');
    expect(result.itemSku).toBe('CC-1');
    expect(result.itemUnit).toBe('PCS');
    expect(result.itemCountryOfOrigin).toBe('India');
    expect(result.exporterName).toBe('Acme');
  });

  it('withholds item-identity fields entirely for a multi-item invoice, rather than transferring only item 1', () => {
    const rows = [
      { ...emptyItemRow(), description: 'Cushion covers' },
      { ...emptyItemRow(), description: 'Table runners' },
    ];
    const values = { exporterName: 'Acme', items: serializeItemRows(rows) };
    const result = invoiceTransferValues(values);
    expect(result.itemDescription).toBe('');
    expect(result.itemSku).toBe('');
    expect(result.itemUnit).toBe('');
    expect(result.itemCountryOfOrigin).toBe('');
    expect(result.exporterName).toBe('Acme');
  });
});
