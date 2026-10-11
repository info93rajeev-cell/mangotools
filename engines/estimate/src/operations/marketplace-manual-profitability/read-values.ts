import { err, ok, type Result } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import { readDecimal } from '../../lib/decimal-input.ts';
import type { Scenario } from './schema.ts';

/** Field readers shared by the TASK-008L validation step. Each returns a typed result. */

export function missing<T>(path: string): Result<T> {
  return err('ESTIMATE_MISSING_FEE_VALUE', { path });
}

/** Money: at most 2 decimals, never negative. */
export function readMoney(raw: string, path: string): Result<string> {
  return readDecimal(raw, path, {
    maxDecimals: 2,
    allowNegative: false,
    negativeCode: 'ESTIMATE_NEGATIVE_AMOUNT',
  });
}

/** Percentage: at most 4 decimals, 0 ≤ value ≤ 100 (`code` names the out-of-range error). */
export function readPercent(
  raw: string,
  path: string,
  code = 'ESTIMATE_PERCENT_OUT_OF_RANGE',
): Result<string> {
  const value = readDecimal(raw, path, { maxDecimals: 4, allowNegative: true });
  if (!value.ok) return value;
  if (compare(value.value, '0') < 0 || compare(value.value, '100') > 0) return err(code, { path });
  return value;
}

/** Weight: at most 3 decimals, never negative. */
export function readWeight(raw: string, path: string): Result<string> {
  return readDecimal(raw, path, { maxDecimals: 3, allowNegative: false });
}

/** Reads an optional value with `reader`, keeping `undefined` when the field is absent. */
export function readOptional(
  raw: string | undefined,
  path: string,
  reader: (raw: string, path: string) => Result<string>,
): Result<string | undefined> {
  return raw === undefined ? ok(undefined) : reader(raw, path);
}

/** Index of the first repeated id, or -1. */
export function duplicateIndex(ids: readonly string[]): number {
  const seen = new Set<string>();
  for (const [index, id] of ids.entries()) {
    if (seen.has(id)) return index;
    seen.add(id);
  }
  return -1;
}

export function checkScenarioList(scenarios: readonly Scenario[], path: string): Result<true> {
  return scenarios.length === 0 ? err('ESTIMATE_INVALID_SCENARIO_LIST', { path }) : ok(true);
}

/** Runs `read` over `items` in order, stopping at the first error. */
export function readAll<I, O>(
  items: readonly I[],
  read: (item: I, index: number) => Result<O>,
): Result<O[]> {
  const out: O[] = [];
  for (const [index, item] of items.entries()) {
    const value = read(item, index);
    if (!value.ok) return value;
    out.push(value.value);
  }
  return ok(out);
}
