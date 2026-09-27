import { defineOperation, err, ok, type Result } from '@mangotools/core';
import { MAX_INPUT_CHARS } from '../../errors.ts';
import { isParseDateFailure, parseDateTime } from './parse-date.ts';
import { isParseTimestampFailure, parseTimestamp, type TimestampUnit } from './parse-timestamp.ts';
import type { TimestampParams } from './schema.ts';
import { timestampInput, timestampOutput, timestampParams } from './schema.ts';

function unixParts(ms: number): { seconds: number; milliseconds: number } {
  return { seconds: Math.floor(ms / 1000), milliseconds: ms };
}

function toDateResult(ms: number, unit: TimestampUnit) {
  const date = new Date(ms);
  const { seconds, milliseconds } = unixParts(ms);
  return {
    text: date.toISOString(),
    isoString: date.toISOString(),
    utcDisplay: date.toUTCString(),
    localDisplay: date.toString(),
    unixSeconds: seconds,
    unixMilliseconds: milliseconds,
    detectedUnit: unit,
  };
}

function toTimestampResult(ms: number, basis: 'local' | 'utc') {
  const date = new Date(ms);
  const { seconds, milliseconds } = unixParts(ms);
  return {
    text: String(seconds),
    isoString: date.toISOString(),
    utcDisplay: date.toUTCString(),
    localDisplay: date.toString(),
    unixSeconds: seconds,
    unixMilliseconds: milliseconds,
    interpretedBasis: basis,
  };
}

type TimestampResult = Result<
  ReturnType<typeof toDateResult> | ReturnType<typeof toTimestampResult>
>;

function runToDate(text: string, unit: TimestampParams['unit']): TimestampResult {
  let parsed: ReturnType<typeof parseTimestamp>;
  try {
    parsed = parseTimestamp(text, unit);
  } catch (e) {
    if (!isParseTimestampFailure(e)) throw e;
    if (e.tag === 'not-integer') return err('DATA_TIMESTAMP_INVALID', { path: 'text' });
    return err('DATA_TIMESTAMP_AMBIGUOUS_LENGTH', { path: 'text', details: { digits: e.digits } });
  }
  const ms = parsed.unit === 'seconds' ? parsed.value * 1000 : parsed.value;
  if (!Number.isFinite(ms) || Number.isNaN(new Date(ms).getTime())) {
    return err('DATA_TIMESTAMP_OUT_OF_RANGE', { path: 'text' });
  }
  return ok(toDateResult(ms, parsed.unit));
}

function runToTimestamp(text: string, basis: TimestampParams['basis']): TimestampResult {
  let parsed: ReturnType<typeof parseDateTime>;
  try {
    parsed = parseDateTime(text, basis);
  } catch (e) {
    if (!isParseDateFailure(e)) throw e;
    const code =
      e.tag === 'unsupported-format'
        ? 'DATA_TIMESTAMP_UNSUPPORTED_FORMAT'
        : 'DATA_TIMESTAMP_INVALID_DATE';
    return err(code, { path: 'text' });
  }
  return ok(toTimestampResult(parsed.ms, parsed.basis));
}

/**
 * `localDisplay` reflects whatever timezone the running JS engine itself resolves as local, so it
 * cannot be byte-identical between Node and a browser worker on a machine where those differ. This
 * operation is declared `worker`-only (see engines/data/README.md's "Determinism" note) so the
 * cross-environment determinism suite — which otherwise hashes every `node`-capable fixture's full
 * result in both Node and a browser worker and expects an exact match — never runs it; every other
 * field here (UTC, ISO, Unix seconds/milliseconds) is fully deterministic regardless.
 */
export const timestampConvert = defineOperation({
  id: 'data.timestamp.convert',
  major: 1,
  title: 'Convert Unix timestamps and dates',
  summary: 'Converts a Unix timestamp to a date, or a date/time to a Unix timestamp.',
  input: timestampInput,
  params: timestampParams,
  output: timestampOutput,
  errors: [
    'DATA_TIMESTAMP_EMPTY',
    'DATA_TIMESTAMP_INVALID',
    'DATA_TIMESTAMP_AMBIGUOUS_LENGTH',
    'DATA_TIMESTAMP_OUT_OF_RANGE',
    'DATA_TIMESTAMP_UNSUPPORTED_FORMAT',
    'DATA_TIMESTAMP_INVALID_DATE',
    'DATA_INPUT_TOO_LARGE',
  ],
  runtimes: ['worker'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    if (input.text.length > MAX_INPUT_CHARS)
      return err('DATA_INPUT_TOO_LARGE', { details: { limitMb: 50 } });
    if (input.text.trim() === '') return err('DATA_TIMESTAMP_EMPTY', { path: 'text' });
    return params.direction === 'to-date'
      ? runToDate(input.text, params.unit)
      : runToTimestamp(input.text, params.basis);
  },
});
