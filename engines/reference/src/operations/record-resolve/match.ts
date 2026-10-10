import { compare } from '@mangotools/engine-numeric';
import type { Bounds, CheckedRecord, Query } from './validate.ts';

/** Both boundaries inclusive. A record without `effectiveFrom` is never in effect. */
export function isInEffect(record: CheckedRecord, effectiveDate: string): boolean {
  if (record.effectiveFrom === undefined || record.effectiveFrom > effectiveDate) return false;
  return record.effectiveTo === undefined || effectiveDate <= record.effectiveTo;
}

/** Exact, case-sensitive string equality for every selector the record requires. */
function selectorsMatch(record: CheckedRecord, query: Query): boolean {
  return Object.entries(record.match).every(
    ([key, required]) => Object.hasOwn(query.selectors, key) && query.selectors[key] === required,
  );
}

/** `min < value <= max`; a missing bound does not restrict. Units were checked in validation. */
function inRange(value: string, bounds: Bounds): boolean {
  if (bounds.min !== undefined && compare(value, bounds.min) <= 0) return false;
  return bounds.max === undefined || compare(value, bounds.max) <= 0;
}

function rangesMatch(record: CheckedRecord, query: Query): boolean {
  return Object.entries(record.ranges).every(([key, bounds]) => {
    const asked = Object.hasOwn(query.values, key) ? query.values[key] : undefined;
    return asked !== undefined && inRange(asked.value, bounds);
  });
}

export function meetsConditions(record: CheckedRecord, query: Query): boolean {
  return selectorsMatch(record, query) && rangesMatch(record, query);
}

/** Orders strings by Unicode code point (not UTF-16 code unit, not locale). */
export function compareCodePoints(a: string, b: string): number {
  const left = Array.from(a, (char) => char.codePointAt(0) ?? 0);
  const right = Array.from(b, (char) => char.codePointAt(0) ?? 0);
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return left.length - right.length;
}
