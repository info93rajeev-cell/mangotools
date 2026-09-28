import { defineOperation, type OpWarning, ok, warning } from '@mangotools/core';
import { checkWeights } from './compute.ts';
import { measure } from './measure.ts';
import { buildOutput } from './output.ts';
import { packingListInput, packingListOutput, packingListParams } from './schema.ts';

/** Standing compliance-boundary warnings shown on every result, regardless of input. */
function standingWarnings(): OpWarning[] {
  return [
    warning('EXPORT_DOCUMENT_PREPARATION_HELPER_ONLY'),
    warning('EXPORT_VERIFY_BEFORE_FILING'),
    warning('EXPORT_NOT_LEGAL_TAX_ADVICE'),
    warning('EXPORT_PACKING_LIST_SCOPE_LIMIT'),
  ];
}

export const packingList = defineOperation({
  id: 'export.packing.list',
  major: 1,
  title: 'Packing list (export document draft)',
  summary:
    'Prepares a packing list draft for an export shipment — exporter, buyer/consignee, item, package, weight and declaration details.',
  input: packingListInput,
  params: packingListParams,
  output: packingListOutput,
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
