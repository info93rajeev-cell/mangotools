import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { invoiceCommercialV2 } from './operation.ts';

const run = (input: Record<string, unknown>) =>
  executeOperation(invoiceCommercialV2, input, {}, createTestContext());

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
const item = (unitPrice: string, quantity = '1000') => [
  { description: 'Cotton buttons', hsn: '960621', quantity, unit: 'PCS', unitPrice },
];

describe('export.invoice.commercial@2 — review fixes (Nov 2026)', () => {
  it('shows a 3–4 decimal unit price as entered, so qty × shown price = shown amount', async () => {
    const result = await run({ ...base, items: item('0.005') });
    if (!result.ok) throw new Error('expected success');
    const [row] = result.value.items as { unitPrice: string; lineAmount: string }[];
    expect(row?.unitPrice).toBe('0.005'); // 1000 × 0.005 = 5.00
    expect(row?.lineAmount).toBe('5.00');
  });

  it('still shows a two-decimal price with two decimals', async () => {
    const result = await run({ ...base, items: item('3.5', '500') });
    if (!result.ok) throw new Error('expected success');
    expect((result.value.items as { unitPrice: string }[])[0]?.unitPrice).toBe('3.50');
  });

  it('rejects a gross weight below the net weight, like the packing list', async () => {
    const result = await run({ ...base, items: item('1'), grossWeight: '100', netWeight: '125' });
    expect(!result.ok && result.error.code).toBe('EXPORT_GROSS_WEIGHT_BELOW_NET');
    expect(!result.ok && result.error.path).toBe('grossWeight');
  });

  it('accepts one weight without the other', async () => {
    expect((await run({ ...base, items: item('1'), grossWeight: '100' })).ok).toBe(true);
    expect((await run({ ...base, items: item('1'), netWeight: '100' })).ok).toBe(true);
  });
});
