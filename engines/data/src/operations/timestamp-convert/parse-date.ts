/**
 * Parses a constrained ISO-like date/time string with the numeric, component-based `Date`
 * constructors (never the single-argument string constructor, whose behavior for a zone-less
 * string is implementation-defined) so UTC vs. local interpretation is always explicit and under
 * our control. A trailing `Z` always means UTC, regardless of the `basis` param; otherwise `basis`
 * decides. Month/hour/minute/second are range-checked directly, and day-of-month validity is
 * checked by confirming the constructed date didn't roll over (so 2023-02-30 is rejected, not
 * silently turned into 2023-03-02).
 */

export type ParseDateFailure = { tag: 'unsupported-format' } | { tag: 'invalid-date' };

export function isParseDateFailure(value: unknown): value is ParseDateFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

export interface ParsedDate {
  ms: number;
  basis: 'local' | 'utc';
}

const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(Z)?$/;

function fail(failure: ParseDateFailure): never {
  throw failure;
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function parseDateTime(text: string, basisParam: 'local' | 'utc'): ParsedDate {
  const trimmed = text.trim();
  const m = DATE_TIME.exec(trimmed);
  if (!m) fail({ tag: 'unsupported-format' });

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] ?? '0');
  const minute = Number(m[5] ?? '0');
  const second = Number(m[6] ?? '0');
  const ms = Number((m[7] ?? '0').padEnd(3, '0'));
  if (
    !inRange(month, 1, 12) ||
    !inRange(hour, 0, 23) ||
    !inRange(minute, 0, 59) ||
    !inRange(second, 0, 59)
  ) {
    fail({ tag: 'invalid-date' });
  }

  const basis = m[8] === 'Z' ? 'utc' : basisParam;
  const date =
    basis === 'utc'
      ? new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms))
      : new Date(year, month - 1, day, hour, minute, second, ms);
  const dayMatches =
    basis === 'utc'
      ? date.getUTCDate() === day && date.getUTCMonth() === month - 1
      : date.getDate() === day && date.getMonth() === month - 1;
  if (!dayMatches) fail({ tag: 'invalid-date' });

  return { ms: date.getTime(), basis };
}
