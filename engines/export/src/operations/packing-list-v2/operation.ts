import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { checkWeights } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput } from './output.ts';
import { packingListInputV2, packingListOutputV2, packingListParamsV2 } from './schema.ts';

/** Standing compliance-boundary warnings shown on every result, identical to v1. */
function standingWarnings(): OpWarning[] {
  return [
    warning('EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY'),
    warning('EXPORT_VERIFY_BEFORE_FILING'),
    warning('EXPORT_NOT_LEGAL_TAX_ADVICE'),
    warning('EXPORT_PACKING_LIST_SCOPE_LIMIT'),
  ];
}

/**
 * Major version 2 of the packing list: v1 (`export.packing.list@1`, exactly one item row) is
 * untouched and stays fully supported — see its own folder. This version replaces the single scalar
 * item fields with a structured `items` array (1 to `MAX_ITEMS` rows); every shipment-level packing
 * field (package count, weights, dimensions, marks) stays exactly as it was in v1 — per TASK-009H,
 * these were never per-item values. Per TASK-009I.
 */
export const packingListV2 = defineOperation({
  id: 'export.packing.list',
  major: 2,
  title: 'Packing list (export document draft, multi-item)',
  summary:
    'Prepares a packing list draft for an export shipment with one or more items — exporter, buyer/consignee, items, package, weight and declaration details.',
  input: packingListInputV2,
  params: packingListParamsV2,
  output: packingListOutputV2,
  errors: [
    'EXPORT_MISSING_INPUT',
    'EXPORT_TEXT_TOO_LONG',
    'EXPORT_INVALID_NUMBER',
    'EXPORT_TOO_MANY_DECIMALS',
    'EXPORT_NOT_POSITIVE',
    'EXPORT_NOT_WHOLE',
    'EXPORT_INVALID_DATE',
    'EXPORT_GSTIN_INVALID_FORMAT',
    'EXPORT_HSN_INVALID_FORMAT',
    'EXPORT_GROSS_WEIGHT_BELOW_NET',
    'EXPORT_INVALID_ITEMS',
    'EXPORT_TOO_FEW_ITEMS',
    'EXPORT_TOO_MANY_ITEMS',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const checked = checkWeights(measured.value);
    if (!checked.ok) return checked;
    return ok(buildOutput(checked.value), standingWarnings());
  },
});
