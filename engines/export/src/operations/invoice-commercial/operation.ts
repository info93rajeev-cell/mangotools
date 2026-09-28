import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { toFixedString } from '@mangotools/engine-numeric';
import { computeInvoice } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput, workingSteps } from './output.ts';
import {
  invoiceCommercialInput,
  invoiceCommercialOutput,
  invoiceCommercialParams,
} from './schema.ts';

/** Standing compliance-boundary warnings shown on every result, regardless of input. */
function standingWarnings(): OpWarning[] {
  return [
    warning('EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY'),
    warning('EXPORT_VERIFY_BEFORE_FILING'),
    warning('EXPORT_NOT_LEGAL_TAX_ADVICE'),
    warning('EXPORT_INVOICE_SCOPE_LIMIT'),
  ];
}

export const invoiceCommercial = defineOperation({
  id: 'export.invoice.commercial',
  major: 1,
  title: 'Commercial invoice (export document draft)',
  summary:
    'Prepares a commercial invoice draft for an export shipment — exporter, buyer/consignee, item, shipping and declaration details, with the item line total and invoice total calculated.',
  input: invoiceCommercialInput,
  params: invoiceCommercialParams,
  output: invoiceCommercialOutput,
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
