import { err, ok, type Result } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import type { Measured } from './types.ts';

/**
 * This tool is a document generator, not a calculator: it performs no duty, tax, freight, forex,
 * customs-value, or regulatory-eligibility calculation. The one check here is a plain data-integrity
 * check, not a calculation — a packed shipment cannot weigh less than the goods inside it.
 */
export function checkWeights(m: Measured): Result<Measured> {
  if (compare(m.grossWeight, m.netWeight) < 0) {
    return err('EXPORT_GROSS_WEIGHT_BELOW_NET', { path: 'grossWeight' });
  }
  return ok(m);
}
