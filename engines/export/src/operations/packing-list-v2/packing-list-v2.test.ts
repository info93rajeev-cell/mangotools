import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { packingList } from '../packing-list/operation.ts';
import { MAX_ITEMS } from './measure.ts';
import { packingListV2 } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(packingListV2, input, params, createTestContext());

const base = {
  exporterName: 'Sunrise Handicrafts Exports',
  exporterAddress: '12 MG Road, Jaipur, Rajasthan 302001, India',
  exporterIec: 'AAAAA1234A',
  buyerName: 'Global Home Decor LLC',
  buyerAddress: '500 Market Street, San Francisco, CA 94105, USA',
  destinationCountry: 'United States',
  packingListNumber: 'SHE/PL/2026/014',
  packingListDate: '2026-09-28',
  weightUnit: 'kg',
  netWeight: '125',
  grossWeight: '135',
  packageCount: '10',
};

const oneItem = [
  {
    description: 'Hand-block printed cotton cushion covers',
    sku: 'CC-BLK-001',
    hsn: '630490',
    countryOfOrigin: 'India',
    quantity: '500',
    unit: 'PCS',
  },
];

const twoItems = [
  ...oneItem,
  { description: 'Hand-block printed table runners', hsn: '630790', quantity: '200', unit: 'PCS' },
];

describe('export.packing.list@2', () => {
  it('is registered as major version 2 of the same operation id v1 uses, and v1 stays major 1', () => {
    expect(packingListV2.id).toBe('export.packing.list');
    expect(packingListV2.major).toBe(2);
    expect(packingList.id).toBe('export.packing.list');
    expect(packingList.major).toBe(1);
  });

  it('echoes a single item row back for the preview', async () => {
    const result = await run({ ...base, items: oneItem });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.items).toEqual([
      {
        description: 'Hand-block printed cotton cushion covers',
        sku: 'CC-BLK-001',
        hsn: '630490',
        countryOfOrigin: 'India',
        quantity: '500',
        unit: 'PCS',
      },
    ]);
  });

  it('echoes two independent item rows, each with their own optional fields', async () => {
    const result = await run({ ...base, items: twoItems });
    if (!result.ok) throw new Error('expected success');
    const items = result.value.items as Record<string, unknown>[];
    expect(items).toHaveLength(2);
    expect(items[1]).toEqual({
      description: 'Hand-block printed table runners',
      sku: null,
      hsn: '630790',
      countryOfOrigin: null,
      quantity: '200',
      unit: 'PCS',
    });
  });

  it('never invents a cross-item quantity total, even when units are identical', async () => {
    const result = await run({ ...base, items: twoItems });
    if (!result.ok) throw new Error('expected success');
    expect(result.value).not.toHaveProperty('totalQuantity');
    expect(result.value).not.toHaveProperty('itemQuantity');
  });

  it('leaves shipment-level packing fields as one set of scalars, unaffected by item count', async () => {
    const oneItemResult = await run({ ...base, items: oneItem });
    const twoItemResult = await run({ ...base, items: twoItems });
    if (!oneItemResult.ok || !twoItemResult.ok) throw new Error('expected success');
    for (const result of [oneItemResult, twoItemResult]) {
      expect(result.value.packageCount).toBe('10');
      expect(result.value.netWeight).toBe('125');
      expect(result.value.grossWeight).toBe('135');
    }
  });

  it('performs no calculation: working is always empty, regardless of item count', async () => {
    const result = await run({ ...base, items: twoItems });
    expect(result.ok && result.value.working).toEqual([]);
  });

  it('accepts exactly MAX_ITEMS rows', async () => {
    const items = Array.from({ length: MAX_ITEMS }, (_, i) => ({
      description: `Item ${i + 1}`,
      quantity: '1',
      unit: 'PCS',
    }));
    const result = await run({ ...base, items });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.items).toHaveLength(MAX_ITEMS);
  });

  it('rejects more than MAX_ITEMS rows', async () => {
    const items = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({
      description: `Item ${i + 1}`,
      quantity: '1',
      unit: 'PCS',
    }));
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_TOO_MANY_ITEMS');
    expect(!result.ok && result.error.path).toBe('items');
    expect(!result.ok && result.error.details?.max).toBe(MAX_ITEMS);
  });

  it('rejects zero items — every packing list must contain at least one', async () => {
    const result = await run({ ...base, items: [] });
    expect(!result.ok && result.error.code).toBe('EXPORT_TOO_FEW_ITEMS');
    expect(!result.ok && result.error.path).toBe('items');
  });

  it('accepts items encoded as a JSON string, identically to a native array (the browser wire format)', async () => {
    const fromArray = await run({ ...base, items: oneItem });
    const fromString = await run({ ...base, items: JSON.stringify(oneItem) });
    expect(fromArray).toEqual(fromString);
  });

  it('identifies an invalid quantity by its own row, not row 0', async () => {
    const items = [oneItem[0], { ...oneItem[0], quantity: '0' }];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_POSITIVE');
    expect(!result.ok && result.error.path).toBe('items[1].quantity');
  });

  it('identifies a missing required description by its own row', async () => {
    const { description, ...withoutDescription } = oneItem[0] as Record<string, string>;
    const items = [oneItem[0], withoutDescription];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('items[1].description');
  });

  it('identifies a missing required unit by its own row', async () => {
    const { unit, ...withoutUnit } = oneItem[0] as Record<string, string>;
    const items = [oneItem[0], withoutUnit];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('items[1].unit');
  });

  it('rejects an invalid HSN format when one is given', async () => {
    const items = [{ ...oneItem[0], hsn: 'ABCD' }];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_HSN_INVALID_FORMAT');
  });

  it('omits optional row fields (sku, hsn, countryOfOrigin) entirely when left blank', async () => {
    const items = [{ description: 'Item A', quantity: '10', unit: 'PCS' }];
    const result = await run({ ...base, items });
    if (!result.ok) throw new Error('expected success');
    const item = (result.value.items as Record<string, unknown>[])[0];
    expect(item?.sku).toBeNull();
    expect(item?.hsn).toBeNull();
    expect(item?.countryOfOrigin).toBeNull();
  });

  it('rejects a zero or negative package count regardless of item count', async () => {
    const result = await run({ ...base, items: twoItems, packageCount: '0' });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_POSITIVE');
  });

  it('rejects a fractional package count regardless of item count', async () => {
    const result = await run({ ...base, items: twoItems, packageCount: '2.5' });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_WHOLE');
  });

  it('rejects a gross weight lower than the net weight regardless of item count', async () => {
    const result = await run({ ...base, items: twoItems, netWeight: '150', grossWeight: '100' });
    expect(!result.ok && result.error.code).toBe('EXPORT_GROSS_WEIGHT_BELOW_NET');
  });

  it('accepts a gross weight exactly equal to the net weight', async () => {
    const result = await run({ ...base, items: oneItem, netWeight: '125', grossWeight: '125' });
    expect(result.ok).toBe(true);
  });

  it('always carries the standing compliance-boundary warnings', async () => {
    const result = await run({ ...base, items: oneItem });
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY',
      'EXPORT_VERIFY_BEFORE_FILING',
      'EXPORT_NOT_LEGAL_TAX_ADVICE',
      'EXPORT_PACKING_LIST_SCOPE_LIMIT',
    ]);
  });

  it('has an English message for every code it can return', () => {
    for (const code of packingListV2.errors) expect(messages[code], code).toBeTruthy();
  });
});
