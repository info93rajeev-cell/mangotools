import { ok, type Result } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';

/**
 * v1 supports exactly one item row, so the invoice subtotal and invoice total are both equal to that
 * row's line total. No tax, duty, or foreign-exchange conversion is calculated — see
 * `EXPORT_INVOICE_SCOPE_LIMIT`.
 */
export function computeInvoice(m: Measured): Result<Computed> {
  const itemLineTotal = mul(m.itemQuantity, m.itemUnitPrice);
  const invoiceSubtotal = itemLineTotal;
  const invoiceTotal = invoiceSubtotal;
  return ok({ itemLineTotal, invoiceSubtotal, invoiceTotal });
}
