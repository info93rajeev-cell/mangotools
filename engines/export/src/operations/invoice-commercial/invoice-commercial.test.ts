import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { invoiceCommercial } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(invoiceCommercial, input, params, createTestContext());

const invoice = {
  exporterName: 'Sunrise Handicrafts Exports',
  exporterAddress: '12 MG Road, Jaipur, Rajasthan 302001, India',
  exporterGstin: '27ABCDE1234F1Z5',
  exporterIec: 'AAAAA1234A',
  exporterContact: '+91 98765 43210 / export@sunrisehandicrafts.example',
  lutArn: 'AD270622000111A',
  authorizedSignatory: 'Raj Mehta',
  buyerName: 'Global Home Decor LLC',
  buyerAddress: '500 Market Street, San Francisco, CA 94105, USA',
  destinationCountry: 'United States',
  buyerContact: 'buyer@globalhomedecor.example',
  invoiceNumber: 'SHE/EXP/2026/014',
  invoiceDate: '2026-09-27',
  currency: 'USD',
  paymentTerms: '100% advance',
  orderReference: 'PO-2026-0098',
  incoterm: 'FOB Mumbai',
  itemDescription: 'Hand-block printed cotton cushion covers',
  itemSku: 'CC-BLK-001',
  itemHsn: '630490',
  itemQuantity: '500',
  itemUnit: 'PCS',
  itemUnitPrice: '3.50',
  itemCountryOfOrigin: 'India',
  itemNetWeight: '125',
  packageCount: '10',
  grossWeight: '135',
  netWeight: '125',
  shippingMode: 'Air Cargo',
  gstDeclaration: 'Supply meant for export under LUT without payment of IGST.',
  exportDeclaration: 'We declare that the information given above is true and correct.',
};

describe('export.invoice.commercial', () => {
  it('computes the item line total, subtotal and invoice total (500 x 3.50 = 1750.00)', async () => {
    const result = await run(invoice);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.itemLineTotal).toBe('1750.00');
    expect(result.value.invoiceSubtotal).toBe('1750.00');
    expect(result.value.invoiceTotal).toBe('1750.00');
  });

  it('echoes exporter, buyer and invoice fields back for the preview', async () => {
    const result = await run(invoice);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.exporterName).toBe('Sunrise Handicrafts Exports');
    expect(result.value.buyerName).toBe('Global Home Decor LLC');
    expect(result.value.invoiceNumber).toBe('SHE/EXP/2026/014');
    expect(result.value.currency).toBe('USD');
  });

  it('omits genuinely optional fields entirely when left blank', async () => {
    const { consigneeName, consigneeAddress, buyerTaxId, trackingNumber, ...minimal } =
      invoice as Record<string, string>;
    const result = await run(minimal);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.consigneeName).toBeNull();
    expect(result.value.consigneeAddress).toBeNull();
    expect(result.value.buyerTaxId).toBeNull();
    expect(result.value.trackingNumber).toBeNull();
  });

  it('builds a signature area from the authorized signatory when given', async () => {
    const result = await run(invoice);
    expect(result.ok && result.value.signatureArea).toContain('Raj Mehta');
  });

  it('falls back to a blank signature line when no signatory is given', async () => {
    const { authorizedSignatory, ...rest } = invoice;
    const result = await run(rest);
    expect(result.ok && result.value.signatureArea).toContain('______________________');
  });

  it('gives the same result for numbers and strings in the item fields', async () => {
    const fromStrings = await run(invoice);
    const fromNumbers = await run({ ...invoice, itemQuantity: 500, itemUnitPrice: 3.5 });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('rejects missing required fields', async () => {
    const { exporterName, ...missing } = invoice;
    const result = await run(missing);
    expect(!result.ok && result.error.code).toBe('EXPORT_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('exporterName');
  });

  it('rejects an invalid GSTIN format', async () => {
    const result = await run({ ...invoice, exporterGstin: 'not-a-gstin' });
    expect(!result.ok && result.error.code).toBe('EXPORT_GSTIN_INVALID_FORMAT');
  });

  it('accepts a lowercase GSTIN by normalizing it to uppercase', async () => {
    const result = await run({ ...invoice, exporterGstin: '27abcde1234f1z5' });
    expect(result.ok && result.value.exporterGstin).toBe('27ABCDE1234F1Z5');
  });

  it('accepts a blank GSTIN (not every exporter is GST-registered)', async () => {
    const { exporterGstin, ...rest } = invoice;
    const result = await run(rest);
    expect(result.ok && result.value.exporterGstin).toBeNull();
  });

  it('rejects an invalid HSN format', async () => {
    const tooShort = await run({ ...invoice, itemHsn: '12' });
    expect(!tooShort.ok && tooShort.error.code).toBe('EXPORT_HSN_INVALID_FORMAT');
    const nonNumeric = await run({ ...invoice, itemHsn: 'ABCD12' });
    expect(!nonNumeric.ok && nonNumeric.error.code).toBe('EXPORT_HSN_INVALID_FORMAT');
  });

  it('accepts 4, 6 and 8 digit HSN codes', async () => {
    for (const itemHsn of ['6304', '630490', '63049010']) {
      const result = await run({ ...invoice, itemHsn });
      expect(result.ok, itemHsn).toBe(true);
    }
  });

  it('rejects zero or negative quantity and unit price', async () => {
    const zeroQty = await run({ ...invoice, itemQuantity: '0' });
    expect(!zeroQty.ok && zeroQty.error.code).toBe('EXPORT_NOT_POSITIVE');
    const negativePrice = await run({ ...invoice, itemUnitPrice: '-1' });
    expect(!negativePrice.ok && negativePrice.error.code).toBe('EXPORT_NOT_POSITIVE');
  });

  it('rejects an invalid invoice date', async () => {
    const badFormat = await run({ ...invoice, invoiceDate: '27-09-2026' });
    expect(!badFormat.ok && badFormat.error.code).toBe('EXPORT_INVALID_DATE');
    const rollover = await run({ ...invoice, invoiceDate: '2026-02-30' });
    expect(!rollover.ok && rollover.error.code).toBe('EXPORT_INVALID_DATE');
  });

  it('rejects a negative optional weight', async () => {
    const result = await run({ ...invoice, grossWeight: '-5' });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_NEGATIVE');
  });

  it('rejects a fractional package count', async () => {
    const result = await run({ ...invoice, packageCount: '2.5' });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_WHOLE');
  });

  it('always carries the standing compliance-boundary warnings', async () => {
    const result = await run(invoice);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY',
      'EXPORT_VERIFY_BEFORE_FILING',
      'EXPORT_NOT_LEGAL_TAX_ADVICE',
      'EXPORT_INVOICE_SCOPE_LIMIT',
    ]);
  });

  it('has an English message for every code it can return', () => {
    for (const code of invoiceCommercial.errors) expect(messages[code], code).toBeTruthy();
  });
});
