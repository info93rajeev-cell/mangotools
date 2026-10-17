import { err, ok, type Result } from '@mangotools/core';
import { compare, parseDecimal } from '@mangotools/engine-numeric';
import type { LevelingInput } from './schema.ts';

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

function sequence(rows: LevelingInput['observations']): Result<true> {
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

function normalizeRow(row: LevelingInput['observations'][number], index: number) {
  const normalized = { ...row };
  for (const key of ['bs', 'is', 'fs'] as const) {
    if (row[key] === undefined) continue;
    const value = decimal(row[key], `observations.${index}.${key}`, true);
    if (!value.ok) return value;
    normalized[key] = value.value;
  }
  return ok(normalized);
}

export function validate(input: LevelingInput): Result<LevelingInput & { startRL: string }> {
  if (!input.startRL?.trim()) return failure('MISSING_START_RL', 'startRL');
  const count = input.observations.length;
  if (count === 0) return failure('EMPTY_OBSERVATIONS', 'observations');
  if (count < 2) return failure('TOO_FEW_OBSERVATIONS', 'observations');
  if (count > 50) return failure('TOO_MANY_OBSERVATIONS', 'observations');
  const start = decimal(input.startRL, 'startRL', false);
  if (!start.ok) return start;
  const checked = {
    ...input,
    startRL: start.value,
    observations: [] as LevelingInput['observations'],
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
  const valid = sequence(checked.observations);
  return valid.ok ? ok(checked) : valid;
}
