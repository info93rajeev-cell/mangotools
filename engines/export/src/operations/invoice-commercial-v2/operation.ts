import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { toFixedString } from '@mangotools/engine-numeric';
import { computeInvoice } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput, workingSteps } from './output.ts';
import {
  invoiceCommercialInputV2,
  invoiceCommercialOutputV2,
  invoiceCommercialParamsV2,
} from './schema.ts';

/** Standing compliance-boundary warnings shown on every result, identical to v1. */
function standingWarnings(): OpWarning[] {
  return [
    warning('EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY'),
    warning('EXPORT_VERIFY_BEFORE_FILING'),
    warning('EXPORT_NOT_LEGAL_TAX_ADVICE'),
    warning('EXPORT_INVOICE_SCOPE_LIMIT'),
  ];
}

/**
 * Major version 2 of the commercial invoice: v1 (`export.invoice.commercial@1`, exactly one item
 * row) is untouched and stays fully supported — see its own folder. This version replaces the single
 * scalar item fields with a structured `items` array (1 to `MAX_ITEMS` rows), everything else the
 * same, per TASK-009G.
 */
export const invoiceCommercialV2 = defineOperation({
  id: 'export.invoice.commercial',
  major: 2,
  title: 'Commercial invoice (export document draft, multi-item)',
  summary:
    'Prepares a commercial invoice draft for an export shipment with one or more line items — exporter, buyer/consignee, items, shipping and declaration details, with each line amount and the invoice total calculated.',
  input: invoiceCommercialInputV2,
  params: invoiceCommercialParamsV2,
  output: invoiceCommercialOutputV2,
  errors: [
    'EXPORT_MISSING_INPUT',
    'EXPORT_TEXT_TOO_LONG',
    'EXPORT_INVALID_NUMBER',
    'EXPORT_TOO_MANY_DECIMALS',
    'EXPORT_NOT_POSITIVE',
    'EXPORT_NOT_NEGATIVE',
    'EXPORT_NOT_WHOLE',
    'EXPORT_INVALID_DATE',
    'EXPORT_GSTIN_INVALID_FORMAT',
    'EXPORT_HSN_INVALID_FORMAT',
    'EXPORT_INVALID_ITEMS',
    'EXPORT_TOO_FEW_ITEMS',
    'EXPORT_TOO_MANY_ITEMS',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const computed = computeInvoice(measured.value);
    if (!computed.ok) return computed;
    const shown = (value: string) => toFixedString(value, params.decimals, params.rounding);
    const working = workingSteps(measured.value, computed.value);
    return ok(buildOutput(measured.value, computed.value, shown, working), standingWarnings());
  },
});
