import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { invoiceCommercial } from '../invoice-commercial/operation.ts';
import { MAX_ITEMS } from './measure.ts';
import { invoiceCommercialV2 } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(invoiceCommercialV2, input, params, createTestContext());

const base = {
  exporterName: 'Sunrise Handicrafts Exports',
  exporterAddress: '12 MG Road, Jaipur, Rajasthan 302001, India',
  exporterIec: 'AAAAA1234A',
  exporterContact: '+91 98765 43210',
  buyerName: 'Global Home Decor LLC',
  buyerAddress: '500 Market Street, San Francisco, CA 94105, USA',
  destinationCountry: 'United States',
  invoiceNumber: 'SHE/EXP/2026/014',
  invoiceDate: '2026-09-27',
  currency: 'USD',
};

const oneItem = [
  {
    description: 'Hand-block printed cotton cushion covers',
    hsn: '630490',
    quantity: '500',
    unit: 'PCS',
    unitPrice: '3.50',
  },
];

const twoItems = [
  ...oneItem,
  {
    description: 'Hand-block printed table runners',
    hsn: '630790',
    quantity: '200',
    unit: 'PCS',
    unitPrice: '2.00',
  },
];

describe('export.invoice.commercial@2', () => {
  it('is registered as major version 2 of the same operation id v1 uses, and v1 stays major 1', () => {
    expect(invoiceCommercialV2.id).toBe('export.invoice.commercial');
    expect(invoiceCommercialV2.major).toBe(2);
    expect(invoiceCommercial.id).toBe('export.invoice.commercial');
    expect(invoiceCommercial.major).toBe(1);
  });

  it('computes a single item line total, subtotal and total (500 x 3.50 = 1750.00)', async () => {
    const result = await run({ ...base, items: oneItem });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.items).toHaveLength(1);
    expect((result.value.items as { lineAmount: string }[])[0]?.lineAmount).toBe('1750.00');
    expect(result.value.invoiceSubtotal).toBe('1750.00');
    expect(result.value.invoiceTotal).toBe('1750.00');
  });

  it('sums two item line totals into the subtotal and total (1750.00 + 400.00 = 2150.00)', async () => {
    const result = await run({ ...base, items: twoItems });
    if (!result.ok) throw new Error('expected success');
    const amounts = (result.value.items as { lineAmount: string }[]).map((i) => i.lineAmount);
    expect(amounts).toEqual(['1750.00', '400.00']);
    expect(result.value.invoiceSubtotal).toBe('2150.00');
    expect(result.value.invoiceTotal).toBe('2150.00');
  });

  it('accepts exactly MAX_ITEMS rows and sums every line amount', async () => {
    const items = Array.from({ length: MAX_ITEMS }, (_, i) => ({
      description: `Item ${i + 1}`,
      hsn: '630490',
      quantity: '10',
      unit: 'PCS',
      unitPrice: '1.00',
    }));
    const result = await run({ ...base, items });
    if (!result.ok) throw new Error('expected success');
    expect(result.value.items).toHaveLength(MAX_ITEMS);
    expect(result.value.invoiceSubtotal).toBe((MAX_ITEMS * 10).toFixed(2));
    expect(result.value.invoiceTotal).toBe((MAX_ITEMS * 10).toFixed(2));
  });

  it('rejects more than MAX_ITEMS rows', async () => {
    const items = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({
      description: `Item ${i + 1}`,
      hsn: '630490',
      quantity: '10',
      unit: 'PCS',
      unitPrice: '1.00',
    }));
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_TOO_MANY_ITEMS');
    expect(!result.ok && result.error.path).toBe('items');
    expect(!result.ok && result.error.details?.max).toBe(MAX_ITEMS);
  });

  it('rejects zero items — every invoice must contain at least one', async () => {
    const result = await run({ ...base, items: [] });
    expect(!result.ok && result.error.code).toBe('EXPORT_TOO_FEW_ITEMS');
    expect(!result.ok && result.error.path).toBe('items');
  });

  it('rejects an unparseable items string without throwing', async () => {
    const result = await run({ ...base, items: 'not json' });
    expect(!result.ok && result.error.code).toBe('EXPORT_INVALID_ITEMS');
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

  it('identifies an invalid unit price by its own row', async () => {
    const items = [oneItem[0], { ...oneItem[0], unitPrice: '-1' }];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_POSITIVE');
    expect(!result.ok && result.error.path).toBe('items[1].unitPrice');
  });

  it('identifies a missing required HSN by its own row', async () => {
    const { hsn, ...withoutHsn } = oneItem[0] as Record<string, string>;
    const items = [oneItem[0], withoutHsn];
    const result = await run({ ...base, items });
    expect(!result.ok && result.error.code).toBe('EXPORT_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('items[1].hsn');
  });

  it('omits optional row fields (sku, countryOfOrigin, netWeight) entirely when left blank', async () => {
    const result = await run({ ...base, items: oneItem });
    if (!result.ok) throw new Error('expected success');
    const item = (result.value.items as Record<string, unknown>[])[0];
    expect(item?.sku).toBeNull();
    expect(item?.countryOfOrigin).toBeNull();
    expect(item?.netWeight).toBeNull();
  });

  it('always carries the standing compliance-boundary warnings, unchanged from v1', async () => {
    const result = await run({ ...base, items: oneItem });
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY',
      'EXPORT_VERIFY_BEFORE_FILING',
      'EXPORT_NOT_LEGAL_TAX_ADVICE',
      'EXPORT_INVOICE_SCOPE_LIMIT',
    ]);
  });

  it('has an English message for every code it can return', () => {
    for (const code of invoiceCommercialV2.errors) expect(messages[code], code).toBeTruthy();
  });
});
