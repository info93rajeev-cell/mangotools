import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import { isCalendarDate } from './dates.ts';
import type { RecordResolveInput, ReferenceConditions, ReferenceRecord } from './schema.ts';

export const MAX_RECORDS = 5000;
export const MAX_DATASET_VERSION = 64;

export interface QueryValue {
  value: string;
  unit?: string;
}

export interface Query {
  selectors: Readonly<Record<string, string>>;
  values: Readonly<Record<string, QueryValue>>;
}

export interface Bounds {
  min?: string;
  max?: string;
  unit?: string;
}

/** A record after validation: decimals normalised, original kept for verbatim output. */
export interface CheckedRecord {
  source: ReferenceRecord;
  id: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  match: Readonly<Record<string, string>>;
  ranges: Readonly<Record<string, Bounds>>;
}

export interface Checked {
  datasetVersion: string;
  effectiveDate: string;
  query: Query;
  records: CheckedRecord[];
}

const missing = (path: string) => err('REFERENCE_MISSING_INPUT', { path });

function readDecimal(raw: string | undefined, path: string): Result<string> {
  if (raw === undefined || raw === '') return missing(path);
  const parsed = parseDecimal(raw);
  return parsed.ok ? ok(parsed.value) : err('REFERENCE_INVALID_NUMBER', { path });
}

function checkDate(raw: string | undefined, path: string, required: boolean): Result<void> {
  if (raw === undefined) return required ? missing(path) : ok(undefined);
  if (raw === '' && required) return missing(path);
  return isCalendarDate(raw) ? ok(undefined) : err('REFERENCE_INVALID_DATE', { path });
}

function checkHeader(input: RecordResolveInput): Result<void> {
  const version = input.datasetVersion;
  if (version === undefined) return missing('datasetVersion');
  if (version === '' || version.length > MAX_DATASET_VERSION) {
    return err('REFERENCE_INVALID_DATASET_VERSION', {
      path: 'datasetVersion',
      details: { max: MAX_DATASET_VERSION },
    });
  }
  const date = checkDate(input.effectiveDate, 'effectiveDate', true);
  if (!date.ok) return date;
  if (input.records === undefined) return missing('records');
  if (input.records.length > MAX_RECORDS) {
    return err('REFERENCE_TOO_MANY_RECORDS', { path: 'records', details: { max: MAX_RECORDS } });
  }
  return input.conditions === undefined ? missing('conditions') : ok(undefined);
}

function checkQuery(conditions: ReferenceConditions): Result<Query> {
  const values: Record<string, QueryValue> = {};
  for (const [key, entry] of Object.entries(conditions.values ?? {})) {
    const value = readDecimal(entry.value, `conditions.values.${key}.value`);
    if (!value.ok) return value;
    values[key] =
      entry.unit === undefined ? { value: value.value } : { value: value.value, unit: entry.unit };
  }
  return ok({ selectors: conditions.selectors ?? {}, values });
}

function readBound(raw: string | undefined, path: string): Result<string | undefined> {
  return raw === undefined ? ok(undefined) : readDecimal(raw, path);
}

function checkRange(range: Bounds, path: string, query: Query, key: string): Result<Bounds> {
  if (range.min === undefined && range.max === undefined) {
    return err('REFERENCE_MALFORMED_RANGE', { path });
  }
  const min = readBound(range.min, `${path}.min`);
  if (!min.ok) return min;
  const max = readBound(range.max, `${path}.max`);
  if (!max.ok) return max;
  if (min.value !== undefined && max.value !== undefined && compare(min.value, max.value) >= 0) {
    return err('REFERENCE_MALFORMED_RANGE', { path });
  }
  const asked = Object.hasOwn(query.values, key) ? query.values[key] : undefined;
  if (asked !== undefined && asked.unit !== range.unit) {
    return err('REFERENCE_UNIT_MISMATCH', { path: `conditions.values.${key}.unit` });
  }
  return ok({ min: min.value, max: max.value, unit: range.unit });
}

function checkRanges(
  record: ReferenceRecord,
  path: string,
  query: Query,
): Result<Record<string, Bounds>> {
  const ranges: Record<string, Bounds> = {};
  for (const [key, range] of Object.entries(record.ranges ?? {})) {
    const checked = checkRange(range, `${path}.ranges.${key}`, query, key);
    if (!checked.ok) return checked;
    ranges[key] = checked.value;
  }
  return ok(ranges);
}

function checkInterval(record: ReferenceRecord, path: string): Result<void> {
  const from = checkDate(record.effectiveFrom, `${path}.effectiveFrom`, false);
  if (!from.ok) return from;
  const to = checkDate(record.effectiveTo, `${path}.effectiveTo`, false);
  if (!to.ok) return to;
  const { effectiveFrom, effectiveTo } = record;
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    return err('REFERENCE_INVALID_INTERVAL', { path: `${path}.effectiveTo` });
  }
  return ok(undefined);
}

function checkRecord(
  record: ReferenceRecord,
  path: string,
  seen: Set<string>,
  query: Query,
): Result<CheckedRecord> {
  if (record.id === undefined || record.id === '') return missing(`${path}.id`);
  if (seen.has(record.id)) return err('REFERENCE_DUPLICATE_RECORD_ID', { path: `${path}.id` });
  seen.add(record.id);
  if (record.status === undefined || record.status === '') return missing(`${path}.status`);
  const interval = checkInterval(record, path);
  if (!interval.ok) return interval;
  const ranges = checkRanges(record, path, query);
  if (!ranges.ok) return ranges;
  return ok({
    source: record,
    id: record.id,
    effectiveFrom: record.effectiveFrom,
    effectiveTo: record.effectiveTo,
    match: record.match ?? {},
    ranges: ranges.value,
  });
}

/** Validates the whole dataset and query before any matching. First problem wins, in input order. */
export function checkInput(input: RecordResolveInput): Result<Checked> {
  const header = checkHeader(input);
  if (!header.ok) return header;
  const query = checkQuery(input.conditions ?? {});
  if (!query.ok) return query;
  const seen = new Set<string>();
  const records: CheckedRecord[] = [];
  for (const [index, record] of (input.records ?? []).entries()) {
    const checked = checkRecord(record, `records.${index}`, seen, query.value);
    if (!checked.ok) return checked;
    records.push(checked.value);
  }
  return ok({
    datasetVersion: input.datasetVersion ?? '',
    effectiveDate: input.effectiveDate ?? '',
    query: query.value,
    records,
  });
}
