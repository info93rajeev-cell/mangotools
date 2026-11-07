import { err, ok, type Result } from '@mangotools/core';
import { add, compare, isZero, parseDecimal } from '@mangotools/engine-numeric';
import type { LevelingInputV2, LevelingParamsV2 } from './schema.ts';

const failure = (reason: string, path: string) => err(`SURVEY_LEVELING_${reason}`, { path });

function decimal(text: string, path: string, staff: boolean): Result<string> {
  const parsed = parseDecimal(text, { maxDecimals: 6 });
  if (!parsed.ok) {
    return failure(
      parsed.code === 'TOO_MANY_DECIMALS' ? 'TOO_MANY_DECIMALS' : 'INVALID_DECIMAL',
      path,
    );
  }
  if (staff && compare(parsed.value, '0') < 0) return failure('NEGATIVE_READING', path);
  return ok(parsed.value);
}

function sequence(rows: LevelingInputV2['observations']): Result<true> {
  const combinations = rows.map((row) =>
    ['bs', 'is', 'fs'].filter((key) => row[key as keyof typeof row] !== undefined).join(','),
  );
  const invalid = combinations.findIndex((key) => !['bs', 'is', 'fs', 'bs,fs'].includes(key));
  if (invalid >= 0) return failure('INVALID_READING_COMBINATION', `observations.${invalid}`);
  if (combinations[0] !== 'bs') return failure('INVALID_SEQUENCE', 'observations.0');
  const last = rows.length - 1;
  if (combinations[last] !== 'fs') return failure('INVALID_SEQUENCE', `observations.${last}`);
  const incomplete = combinations.findIndex(
    (key, i) => i > 0 && i < last && key !== 'is' && key !== 'bs,fs',
  );
  if (incomplete >= 0) return failure('CHANGE_POINT_INCONSISTENT', `observations.${incomplete}`);
  return ok(true);
}

function normalizeRow(row: LevelingInputV2['observations'][number], index: number) {
  const normalized = { ...row };
  for (const key of ['bs', 'is', 'fs'] as const) {
    if (row[key] === undefined) continue;
    const value = decimal(row[key], `observations.${index}.${key}`, true);
    if (!value.ok) return value;
    normalized[key] = value.value;
  }
  return ok(normalized);
}

function validateKConstant(kConstant?: string): Result<string | undefined> {
  if (kConstant === undefined || kConstant.trim() === '') {
    return ok(undefined);
  }
  const kParsed = parseDecimal(kConstant.trim(), { maxDecimals: 6 });
  if (!kParsed.ok || compare(kParsed.value, '0') < 0) {
    return failure('INVALID_DECIMAL', 'kConstant');
  }
  return ok(kParsed.value);
}

function validateCounts(input: LevelingInputV2): Result<true> {
  if (!input.startRL?.trim()) return failure('MISSING_START_RL', 'startRL');
  const count = input.observations.length;
  if (count === 0) return failure('EMPTY_OBSERVATIONS', 'observations');
  if (count < 2) return failure('TOO_FEW_OBSERVATIONS', 'observations');
  if (count > 50) return failure('TOO_MANY_OBSERVATIONS', 'observations');
  return ok(true);
}

function validateStartDistance(rawDist?: string): Result<string | undefined> {
  if (rawDist !== undefined && rawDist.trim() !== '') {
    const d = decimal(rawDist, 'observations.0.dist', false);
    if (!d.ok) return d;
    if (compare(d.value, '0') < 0) return failure('NEGATIVE_DISTANCE', 'observations.0.dist');
    if (compare(d.value, '0') > 0) return failure('START_DISTANCE_NONZERO', 'observations.0.dist');
    return ok('0');
  }
  return ok(undefined);
}

function validateRowDistance(
  rawDist: string | undefined,
  index: number,
  requireDistances: boolean,
): Result<string | undefined> {
  if (rawDist === undefined || rawDist.trim() === '') {
    return requireDistances
      ? failure('MISSING_DISTANCE', `observations.${index}.dist`)
      : ok(undefined);
  }
  const d = decimal(rawDist, `observations.${index}.dist`, false);
  if (!d.ok) return d;
  if (compare(d.value, '0') < 0) return failure('NEGATIVE_DISTANCE', `observations.${index}.dist`);
  return ok(d.value);
}

function appendDistance(
  obs: LevelingInputV2['observations'][number] | undefined,
  val: string,
  acc: { normalizedDistances: string[]; totalDistance: string },
) {
  acc.normalizedDistances.push(val);
  acc.totalDistance = add(acc.totalDistance, val);
  if (obs) obs.dist = val;
}

function validateDistances(
  observations: LevelingInputV2['observations'],
  requireDistances: boolean,
): Result<{ normalizedDistances?: string[]; totalDistance?: string }> {
  const startDist = validateStartDistance(observations[0]?.dist);
  if (!startDist.ok) return startDist;

  const acc = { normalizedDistances: ['0'], totalDistance: '0' };
  let allDistancesPresent = true;

  for (let i = 1; i < observations.length; i++) {
    const distRes = validateRowDistance(observations[i]?.dist, i, requireDistances);
    if (!distRes.ok) return distRes;
    if (distRes.value === undefined) {
      allDistancesPresent = false;
    } else {
      appendDistance(observations[i], distRes.value, acc);
    }
  }

  if (requireDistances && isZero(acc.totalDistance)) {
    return failure('ZERO_TOTAL_DISTANCE', 'observations');
  }

  if (allDistancesPresent && observations[0]) {
    observations[0].dist = '0';
  }

  return ok({
    normalizedDistances: allDistancesPresent ? acc.normalizedDistances : undefined,
    totalDistance: allDistancesPresent ? acc.totalDistance : undefined,
  });
}

export interface ValidatedLevelingV2 {
  input: LevelingInputV2 & {
    startRL: string;
    normalizedDistances?: string[];
    totalDistance?: string;
  };
  params: LevelingParamsV2 & {
    kConstant?: string;
  };
}

export function validateV2(
  input: LevelingInputV2,
  params: LevelingParamsV2,
): Result<ValidatedLevelingV2> {
  const kResult = validateKConstant(params.kConstant);
  if (!kResult.ok) return kResult;

  const countResult = validateCounts(input);
  if (!countResult.ok) return countResult;

  const start = decimal(input.startRL ?? '', 'startRL', false);
  if (!start.ok) return start;

  const checked: LevelingInputV2 & { startRL: string } = {
    ...input,
    startRL: start.value,
    observations: [],
  };

  if (input.closingRL !== undefined) {
    const closing = decimal(input.closingRL, 'closingRL', false);
    if (!closing.ok) return closing;
    checked.closingRL = closing.value;
  }

  for (const [i, row] of input.observations.entries()) {
    const normalized = normalizeRow(row, i);
    if (!normalized.ok) return normalized;
    checked.observations.push(normalized.value);
  }

  const validSequence = sequence(checked.observations);
  if (!validSequence.ok) return validSequence;

  const requireDistances = params.adjBy === 'distance' && checked.closingRL !== undefined;
  const distResult = validateDistances(checked.observations, requireDistances);
  if (!distResult.ok) return distResult;

  return ok({
    input: {
      ...checked,
      ...distResult.value,
    },
    params: {
      ...params,
      kConstant: kResult.value,
    },
  });
}
