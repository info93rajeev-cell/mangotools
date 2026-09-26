import { type OpWarning, warning } from '@mangotools/core';

/**
 * Shown on every successful conversion, per the TASK-004C plan's own JPG to PDF tool plan
 * ("Warnings / Disclaimers") — not conditional on any input, so always present, matching how
 * PDF Merge's standing warnings are returned on every successful result.
 */
export const STANDING_WARNINGS: OpWarning[] = [
  warning('PDF_JPG_VERIFY_OUTPUT'),
  warning('PDF_JPG_LARGE_OR_MANY_MAY_FAIL'),
  warning('PDF_JPG_QUALITY_DEPENDS_ON_SOURCE'),
  warning('PDF_JPG_AUTHORIZED_USE_ONLY'),
];
