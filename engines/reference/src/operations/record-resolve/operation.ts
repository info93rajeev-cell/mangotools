import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { compareCodePoints, isInEffect, meetsConditions } from './match.ts';
import {
  type RecordResolveOutput,
  type ResolvedRecord,
  recordResolveInput,
  recordResolveOutput,
  recordResolveParams,
} from './schema.ts';
import { type Checked, type CheckedRecord, checkInput } from './validate.ts';

type Resolution = RecordResolveOutput['resolution'];

function resolutionOf(count: number): Resolution {
  if (count === 0) return 'no-match';
  return count === 1 ? 'matched' : 'ambiguous';
}

/** The record exactly as supplied: status, value and meta are never interpreted. */
function verbatim(record: CheckedRecord): ResolvedRecord {
  const { source } = record;
  const out: ResolvedRecord = {
    id: record.id,
    status: source.status ?? '',
    effectiveFrom: record.effectiveFrom ?? '',
  };
  if (source.effectiveTo !== undefined) out.effectiveTo = source.effectiveTo;
  if (source.value !== undefined) out.value = source.value;
  if (source.meta !== undefined) out.meta = source.meta;
  return out;
}

const sortedKeys = (map: Readonly<Record<string, unknown>>) =>
  Object.keys(map).sort(compareCodePoints);

function workingSteps(
  checked: Checked,
  dateEligible: number,
  candidates: CheckedRecord[],
  resolution: Resolution,
): WorkingStep[] {
  return [
    {
      ref: 'dateEligible',
      formulaKey: 'referenceRecordResolve.dateFilter',
      variables: { effectiveDate: checked.effectiveDate, records: String(checked.records.length) },
      result: String(dateEligible),
    },
    {
      ref: 'conditionEligible',
      formulaKey: 'referenceRecordResolve.conditionFilter',
      variables: {
        dateEligible: String(dateEligible),
        selectors: sortedKeys(checked.query.selectors).join(','),
        values: sortedKeys(checked.query.values).join(','),
      },
      result: String(candidates.length),
    },
    {
      ref: 'resolution',
      formulaKey: 'referenceRecordResolve.outcome',
      variables: { conditionEligible: String(candidates.length) },
      result: resolution,
    },
  ];
}

function warningsFor(resolution: Resolution, count: number): OpWarning[] {
  if (resolution === 'no-match') return [warning('REFERENCE_NO_MATCH')];
  if (resolution === 'ambiguous') {
    return [warning('REFERENCE_AMBIGUOUS', { path: 'records', details: { count } })];
  }
  return [];
}

function resolve(checked: Checked): RecordResolveOutput {
  const inEffect = checked.records.filter((r) => isInEffect(r, checked.effectiveDate));
  const candidates = inEffect.filter((r) => meetsConditions(r, checked.query));
  const resolution = resolutionOf(candidates.length);
  const chosen = resolution === 'matched' ? candidates[0] : undefined;
  return {
    datasetVersion: checked.datasetVersion,
    effectiveDate: checked.effectiveDate,
    resolution,
    ...(chosen ? { record: verbatim(chosen) } : {}),
    candidateIds: candidates.map((r) => r.id).sort(compareCodePoints),
    matchedOn: {
      selectors: chosen ? sortedKeys(chosen.match) : [],
      ranges: chosen ? sortedKeys(chosen.ranges) : [],
    },
    counts: {
      records: checked.records.length,
      dateEligible: inEffect.length,
      conditionEligible: candidates.length,
    },
    working: workingSteps(checked, inEffect.length, candidates, resolution),
  };
}

export const recordResolve = defineOperation({
  id: 'reference.record.resolve',
  major: 1,
  title: 'Reference record resolver',
  summary:
    'Selects the reference record in effect on a date for exact selectors and numeric ranges, or reports no match or ambiguity.',
  input: recordResolveInput,
  params: recordResolveParams,
  output: recordResolveOutput,
  errors: [
    'REFERENCE_MISSING_INPUT',
    'REFERENCE_INVALID_DATE',
    'REFERENCE_INVALID_DATASET_VERSION',
    'REFERENCE_INVALID_INTERVAL',
    'REFERENCE_INVALID_NUMBER',
    'REFERENCE_MALFORMED_RANGE',
    'REFERENCE_UNIT_MISMATCH',
    'REFERENCE_DUPLICATE_RECORD_ID',
    'REFERENCE_TOO_MANY_RECORDS',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    const checked = checkInput(input);
    if (!checked.ok) return checked;
    const output = resolve(checked.value);
    return ok(output, warningsFor(output.resolution, output.counts.conditionEligible));
  },
});
