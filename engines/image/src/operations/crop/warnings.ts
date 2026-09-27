import { type OpWarning, warning } from '@mangotools/core';

/** Shown on every successful crop, unconditionally. */
export const STANDING_WARNINGS: OpWarning[] = [
  warning('IMAGE_VERIFY_OUTPUT'),
  warning('IMAGE_METADATA_NOT_PRESERVED'),
  warning('IMAGE_LARGE_IMAGES_MAY_FAIL'),
];
