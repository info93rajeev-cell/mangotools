/**
 * Parses a Unix timestamp integer and resolves whether it is seconds or milliseconds. When the
 * unit is not given explicitly, the digit count of the value decides: 10 digits or fewer is
 * seconds (covers roughly year 1970 to year 5138), 13 digits or more is milliseconds (roughly
 * year 2001 to year 5138); 11–12 digits is a genuinely ambiguous zone where guessing would be
 * wrong as often as right, so that is a typed failure asking the caller to pick a unit.
 */

export type TimestampUnit = 'seconds' | 'milliseconds';

export type ParseTimestampFailure =
  | { tag: 'not-integer' }
  | { tag: 'ambiguous-length'; digits: number };

export function isParseTimestampFailure(value: unknown): value is ParseTimestampFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

export interface ParsedTimestamp {
  value: number;
  unit: TimestampUnit;
}

const INTEGER = /^-?\d+$/;

function detectUnit(value: number): TimestampUnit | null {
  const digits = String(Math.abs(value)).length;
  if (digits <= 10) return 'seconds';
  if (digits >= 13) return 'milliseconds';
  return null;
}

export function parseTimestamp(text: string, unitParam: 'auto' | TimestampUnit): ParsedTimestamp {
  const trimmed = text.trim();
  if (!INTEGER.test(trimmed)) throw { tag: 'not-integer' } satisfies ParseTimestampFailure;
  const value = Number(trimmed);
  if (unitParam !== 'auto') return { value, unit: unitParam };
  const unit = detectUnit(value);
  if (!unit) {
    throw {
      tag: 'ambiguous-length',
      digits: String(Math.abs(value)).length,
    } satisfies ParseTimestampFailure;
  }
  return { value, unit };
}
