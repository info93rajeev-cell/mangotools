import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { packingList } from './operation.ts';

const run = (input: Record<string, unknown>, params: Record<string, unknown> = {}) =>
  executeOperation(packingList, input, params, createTestContext());

const list = {
  exporterName: 'Sunrise Handicrafts Exports',
  exporterAddress: '12 MG Road, Jaipur, Rajasthan 302001, India',
  exporterIec: 'AAAAA1234A',
  exporterGstin: '27ABCDE1234F1Z5',
  exporterContact: 'export@sunrisehandicrafts.example',
  buyerName: 'Global Home Decor LLC',
  buyerAddress: '500 Market Street, San Francisco, CA 94105, USA',
  destinationCountry: 'United States',
  packingListNumber: 'SHE/PL/2026/014',
  packingListDate: '2026-09-28',
  invoiceNumber: 'SHE/EXP/2026/014',
  invoiceDate: '2026-09-27',
  orderReference: 'PO-2026-0098',
  shippingMode: 'Air Cargo',
  trackingNumber: 'AWB-123456789',
  itemDescription: 'Hand-block printed cotton cushion covers',
  itemSku: 'CC-BLK-001',
  itemHsn: '630490',
  itemCountryOfOrigin: 'India',
  itemQuantity: '500',
  itemUnit: 'PCS',
  packageCount: '10',
  packageType: 'Carton',
  shippingMarks: 'GHD / SF / 1-10',
  weightUnit: 'kg',
  netWeight: '125',
  grossWeight: '135',
  dimensions: '50 x 40 x 35 cm',
  declarationText: 'We certify the above packing details are true and correct.',
  authorizedSignatory: 'Raj Mehta',
};

describe('export.packing.list', () => {
  it('echoes every field back for the preview', async () => {
    const result = await run(list);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.packingListNumber).toBe('SHE/PL/2026/014');
    expect(result.value.exporterName).toBe('Sunrise Handicrafts Exports');
    expect(result.value.buyerName).toBe('Global Home Decor LLC');
    expect(result.value.packageCount).toBe('10');
    expect(result.value.weightUnit).toBe('kg');
    expect(result.value.netWeight).toBe('125');
    expect(result.value.grossWeight).toBe('135');
    expect(result.value.dimensions).toBe('50 x 40 x 35 cm');
  });

  it('performs no calculation: working is always empty', async () => {
    const result = await run(list);
    expect(result.ok && result.value.working).toEqual([]);
  });

  it('omits genuinely optional fields entirely when left blank', async () => {
    const { consigneeName, consigneeAddress, invoiceNumber, dimensions, ...minimal } =
      list as Record<string, string>;
    const result = await run(minimal);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.consigneeName).toBeNull();
    expect(result.value.consigneeAddress).toBeNull();
    expect(result.value.invoiceNumber).toBeNull();
    expect(result.value.dimensions).toBeNull();
  });

  it('builds a signature area from the authorized signatory when given', async () => {
    const result = await run(list);
    expect(result.ok && result.value.signatureArea).toContain('Raj Mehta');
  });

  it('falls back to a blank signature line when no signatory is given', async () => {
    const { authorizedSignatory, ...rest } = list;
    const result = await run(rest);
    expect(result.ok && result.value.signatureArea).toContain('______________________');
  });

  it('gives the same result for numbers and strings in numeric fields', async () => {
    const fromStrings = await run(list);
    const fromNumbers = await run({
      ...list,
      itemQuantity: 500,
      packageCount: 10,
      netWeight: 125,
      grossWeight: 135,
    });
    expect(fromStrings).toEqual(fromNumbers);
  });

  it('rejects missing required fields', async () => {
    const { buyerName, ...missing } = list;
    const result = await run(missing);
    expect(!result.ok && result.error.code).toBe('EXPORT_MISSING_INPUT');
    expect(!result.ok && result.error.path).toBe('buyerName');
  });

  it('accepts a blank GSTIN and blank HSN (both optional for a packing list)', async () => {
    const { exporterGstin, itemHsn, ...rest } = list;
    const result = await run(rest);
    if (!result.ok) throw new Error('expected success');
    expect(result.value.exporterGstin).toBeNull();
    expect(result.value.itemHsn).toBeNull();
  });

  it('rejects an invalid HSN format when one is given', async () => {
    const result = await run({ ...list, itemHsn: 'ABCD' });
    expect(!result.ok && result.error.code).toBe('EXPORT_HSN_INVALID_FORMAT');
  });

  it('rejects a zero or negative package count', async () => {
    const zero = await run({ ...list, packageCount: '0' });
    expect(!zero.ok && zero.error.code).toBe('EXPORT_NOT_POSITIVE');
  });

  it('rejects a fractional package count', async () => {
    const result = await run({ ...list, packageCount: '2.5' });
    expect(!result.ok && result.error.code).toBe('EXPORT_NOT_WHOLE');
  });

  it('rejects a gross weight lower than the net weight', async () => {
    const result = await run({ ...list, netWeight: '150', grossWeight: '100' });
    expect(!result.ok && result.error.code).toBe('EXPORT_GROSS_WEIGHT_BELOW_NET');
  });

  it('accepts a gross weight exactly equal to the net weight', async () => {
    const result = await run({ ...list, netWeight: '125', grossWeight: '125' });
    expect(result.ok).toBe(true);
  });

  it('rejects an invalid packing list date', async () => {
    const badFormat = await run({ ...list, packingListDate: '28-09-2026' });
    expect(!badFormat.ok && badFormat.error.code).toBe('EXPORT_INVALID_DATE');
    const rollover = await run({ ...list, packingListDate: '2026-02-30' });
    expect(!rollover.ok && rollover.error.code).toBe('EXPORT_INVALID_DATE');
  });

  it('always carries the standing compliance-boundary warnings', async () => {
    const result = await run(list);
    const codes = result.ok ? result.warnings.map((w) => w.code) : [];
    expect(codes).toEqual([
      'EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY',
      'EXPORT_VERIFY_BEFORE_FILING',
      'EXPORT_NOT_LEGAL_TAX_ADVICE',
      'EXPORT_PACKING_LIST_SCOPE_LIMIT',
    ]);
  });

  it('has an English message for every code it can return', () => {
    for (const code of packingList.errors) expect(messages[code], code).toBeTruthy();
  });
});
