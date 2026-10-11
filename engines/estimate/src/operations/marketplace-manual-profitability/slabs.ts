import { err, ok, type Result } from '@mangotools/core';
import { compare } from '@mangotools/engine-numeric';
import type { Bounds } from './model.ts';

/** Slab ranges follow `min < value ≤ max`; an absent bound is open (TASK-008E / TASK-008G). */

function lowBelowHigh(low: string | undefined, high: string | undefined): boolean {
  return low === undefined || high === undefined || compare(low, high) < 0;
}

function overlaps(a: Bounds, b: Bounds): boolean {
  return lowBelowHigh(a.min, b.max) && lowBelowHigh(b.min, a.max);
}

function malformed(slab: Bounds): boolean {
  if (slab.min === undefined && slab.max === undefined) return true;
  return slab.min !== undefined && slab.max !== undefined && compare(slab.min, slab.max) >= 0;
}

/** Rejects slabs with neither bound or `min ≥ max`, then any pair of overlapping slabs. */
export function checkSlabBounds(slabs: readonly Bounds[], path: string): Result<true> {
  const bad = slabs.findIndex(malformed);
  if (bad >= 0) return err('ESTIMATE_MALFORMED_SLAB', { path: `${path}.${bad}` });
  for (let i = 0; i < slabs.length; i += 1) {
    for (let j = i + 1; j < slabs.length; j += 1) {
      const a = slabs[i];
      const b = slabs[j];
      if (a && b && overlaps(a, b)) {
        return err('ESTIMATE_OVERLAPPING_SLABS', { path: `${path}.${j}` });
      }
    }
  }
  return ok(true);
}

/** Index of the single slab whose range contains `value` (slabs never overlap), or -1. */
export function matchSlab(slabs: readonly Bounds[], value: string): number {
  return slabs.findIndex(
    (slab) =>
      (slab.min === undefined || compare(value, slab.min) > 0) &&
      (slab.max === undefined || compare(value, slab.max) <= 0),
  );
}
