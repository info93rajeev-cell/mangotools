import { type OpWarning, warning } from '@mangotools/core';

/** Shown on every successful split, unconditionally — matching `pdf.merge@1`'s own standing-warning
 * shape, since both operations share the same underlying risk profile (pdf-lib page copying). */
export const STANDING_WARNINGS: OpWarning[] = [
  warning('PDF_SPLIT_VERIFY_OUTPUT'),
  warning('PDF_SPLIT_FEATURES_MAY_NOT_BE_PRESERVED'),
  warning('PDF_SPLIT_LARGE_OR_PROTECTED_MAY_FAIL'),
  warning('PDF_SPLIT_AUTHORIZED_USE_ONLY'),
];
