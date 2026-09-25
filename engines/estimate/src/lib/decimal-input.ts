import { err, type Result } from '@mangotools/core';
import { isNegative, parseDecimal } from '@mangotools/engine-numeric';

/** Normalises a user number (string or number) into a decimal string, or a typed error. */
export function readDecimal(
  raw: string | number,
  path: string,
  options: { maxDecimals: number; allowNegative: boolean; negativeCode?: string },
): Result<string> {
  const parsed = parseDecimal(typeof raw === 'number' ? String(raw) : raw, {
    maxDecimals: options.maxDecimals,
  });
  if (!parsed.ok) {
    return parsed.code === 'TOO_MANY_DECIMALS'
      ? err('ESTIMATE_TOO_MANY_DECIMALS', { path, details: { max: options.maxDecimals } })
      : err('ESTIMATE_INVALID_NUMBER', { path });
  }
  if (!options.allowNegative && isNegative(parsed.value)) {
    return err(options.negativeCode ?? 'ESTIMATE_NEGATIVE_VALUE', { path });
  }
  return { ok: true, value: parsed.value, warnings: [] };
}
