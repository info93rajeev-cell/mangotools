import { err, type Result } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import { readCount, readPositive } from '../../lib/read-input.ts';

/** Bound work before passing user text to decimal arithmetic. */
export function readMeasurement(raw: string | undefined, path: string): Result<string> {
  if (raw !== undefined && raw.length > 64) return err('LOGISTICS_VALUE_TOO_LONG', { path });
  const parsed = readPositive(raw, path, 12);
  if (!parsed.ok) return parsed;
  if (compare(parsed.value, '1000000000000') >= 0) {
    return err('LOGISTICS_MEASUREMENT_TOO_LARGE', { path });
  }
  return parsed;
}

export function readQuantity(raw: string | undefined, path: string): Result<string> {
  if (raw !== undefined && raw.length > 64) return err('LOGISTICS_VALUE_TOO_LONG', { path });
  return readCount(raw, path, '1000000');
}
