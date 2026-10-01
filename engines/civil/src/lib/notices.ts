import { type DetailValue, type OpWarning, warning } from '@mangotools/core';

/**
 * Result notices for the civil `@2` operations, tagged with a `severity` detail the UI groups by:
 * - `info`: helpful, standing explanation (estimation-aid wording) — shown as compact notes, never
 *   as an alarming banner;
 * - `assumption`: a configurable estimating/product assumption that affected this result;
 * - no severity: a real warning (an unusual value that may reduce reliability).
 */
export const info = (code: string): OpWarning => warning(code, { details: { severity: 'info' } });

export const assumption = (code: string, details: Record<string, DetailValue> = {}): OpWarning =>
  warning(code, { details: { ...details, severity: 'assumption' } });

/** The wastage assumption for a percentage, or the "no allowance" note when it is zero. */
export function wastageAssumption(percent: string): OpWarning {
  return percent === '0'
    ? assumption('CIVIL_ASSUMPTION_NO_WASTAGE')
    : assumption('CIVIL_ASSUMPTION_WASTAGE', { percent });
}
