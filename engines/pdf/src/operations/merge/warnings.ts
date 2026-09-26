import { type OpWarning, warning } from '@mangotools/core';

/**
 * Shown on every successful merge, per the TASK-004A plan's own PDF Merge tool plan (§"PDF MERGE
 * TOOL PLAN" → Warnings) — not conditional on any input, so always present, exactly like the
 * standing notices every Logistics operation already returns on every successful result.
 */
export const STANDING_WARNINGS: OpWarning[] = [
  warning('PDF_MERGE_VERIFY_OUTPUT'),
  warning('PDF_MERGE_FEATURES_MAY_NOT_BE_PRESERVED'),
  warning('PDF_MERGE_LARGE_OR_PROTECTED_MAY_FAIL'),
  warning('PDF_MERGE_AUTHORIZED_USE_ONLY'),
];
