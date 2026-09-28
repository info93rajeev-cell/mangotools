import { ok, type Result } from '@mangotools/core';
import { add, mul } from '@mangotools/engine-numeric';
import type { Computed, Measured } from './types.ts';

/**
 * Each row's line amount is quantity × unit price, exactly as v1. The invoice subtotal is now the
 * exact-decimal sum of every row's line amount (v1 had exactly one row, so its subtotal was that
 * row's amount). No tax, duty, or foreign-exchange conversion is calculated — see
 * `EXPORT_INVOICE_SCOPE_LIMIT`, unchanged from v1.
 */
export function computeInvoice(m: Measured): Result<Computed> {
  const items = m.items.map((item) => ({ lineAmount: mul(item.quantity, item.unitPrice) }));
  const invoiceSubtotal = items.reduce((sum, item) => add(sum, item.lineAmount), '0');
  const invoiceTotal = invoiceSubtotal;
  return ok({ items, invoiceSubtotal, invoiceTotal });
}
