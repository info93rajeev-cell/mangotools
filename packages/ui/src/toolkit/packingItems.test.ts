import { describe, expect, it } from 'vitest';
import {
  emptyPackingItemRow,
  parsePackingItemRows,
  parsePackingRowError,
  serializePackingItemRows,
  shapeIncomingPackingTransfer,
} from './packingItems.ts';

describe('parsePackingItemRows', () => {
  it('returns one blank row for an empty string (the initial/reset state)', () => {
    expect(parsePackingItemRows('')).toEqual([emptyPackingItemRow()]);
  });

  it('returns one blank row for malformed JSON, without throwing', () => {
    expect(parsePackingItemRows('not json')).toEqual([emptyPackingItemRow()]);
  });

  it('round-trips a row written by serializePackingItemRows', () => {
    const rows = [{ ...emptyPackingItemRow(), description: 'Cushion covers', quantity: '500' }];
    expect(parsePackingItemRows(serializePackingItemRows(rows))).toEqual(rows);
  });

  it('defaults a missing unit to PCS', () => {
    const [row] = parsePackingItemRows(JSON.stringify([{ description: 'Widget' }]));
    expect(row).toEqual({ ...emptyPackingItemRow(), description: 'Widget', unit: 'PCS' });
  });
});

describe('serializePackingItemRows', () => {
  it('omits blank optional fields entirely rather than sending empty strings', () => {
    const rows = [{ ...emptyPackingItemRow(), description: 'Widget', quantity: '1' }];
    const parsed = JSON.parse(serializePackingItemRows(rows));
    expect(parsed[0]).not.toHaveProperty('sku');
    expect(parsed[0]).not.toHaveProperty('hsn');
    expect(parsed[0]).not.toHaveProperty('countryOfOrigin');
  });

  it('strips grouping and symbols from the numeric quantity field only', () => {
    const rows = [{ ...emptyPackingItemRow(), description: 'W', quantity: '1,000' }];
    const parsed = JSON.parse(serializePackingItemRows(rows));
    expect(parsed[0].quantity).toBe('1000');
  });
});

describe('parsePackingRowError', () => {
  it('maps an "items[N].field" path to its row index and field', () => {
    expect(parsePackingRowError('items[2].quantity')).toEqual({ index: 2, field: 'quantity' });
  });

  it('returns null for a field this tool does not have (e.g. unitPrice)', () => {
    expect(parsePackingRowError('items[0].unitPrice')).toBeNull();
  });

  it('returns null for a whole-array error (no row index)', () => {
    expect(parsePackingRowError('items')).toBeNull();
  });
});

describe('shapeIncomingPackingTransfer', () => {
  it('folds legacy flat item-identity keys into a single row 0', () => {
    const payload = {
      exporterName: 'Acme',
      itemDescription: 'Cushion covers',
      itemSku: 'CC-1',
      itemUnit: 'PCS',
      itemCountryOfOrigin: 'India',
    };
    const result = shapeIncomingPackingTransfer(payload);
    expect(result.exporterName).toBe('Acme');
    expect(result).not.toHaveProperty('itemDescription');
    const [row] = parsePackingItemRows(result.items as string);
    expect(row).toEqual({
      description: 'Cushion covers',
      sku: 'CC-1',
      hsn: '',
      countryOfOrigin: 'India',
      quantity: '',
      unit: 'PCS',
    });
  });

  it('never populates more than one row, even in principle', () => {
    const payload = { itemDescription: 'Only item' };
    const rows = parsePackingItemRows(shapeIncomingPackingTransfer(payload).items as string);
    expect(rows).toHaveLength(1);
  });

  it('leaves the payload unchanged when there is nothing item-related to fold in', () => {
    const payload = { exporterName: 'Acme', buyerName: 'Global' };
    expect(shapeIncomingPackingTransfer(payload)).toEqual(payload);
  });

  it('defaults a blank incoming unit to PCS, matching the row default elsewhere', () => {
    const result = shapeIncomingPackingTransfer({ itemDescription: 'Widget', itemUnit: '' });
    const [row] = parsePackingItemRows(result.items as string);
    expect(row.unit).toBe('PCS');
  });
});
