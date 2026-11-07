import type { WorkingStep } from '@mangotools/core';
import { add, compare, sub } from '@mangotools/engine-numeric';
import type { ValidatedLevelingV2 } from '../validate.ts';
import type { BaseRow, RawReductionResult } from './types.ts';

function processFirstRow(
  row: ValidatedLevelingV2['input']['observations'][number],
  rl: string,
): BaseRow {
  return {
    station: row.station,
    remarks: row.remarks,
    bs: row.bs ?? null,
    is: row.is ?? null,
    fs: row.fs ?? null,
    rise: null,
    fall: null,
    rl,
    isChangePoint: false,
    dist: row.dist ?? null,
  };
}

function computeRiseFall(prevReading: string, incomingReading: string) {
  const difference = sub(prevReading, incomingReading);
  const rise = compare(difference, '0') > 0 ? difference : '0';
  const fall = compare(difference, '0') < 0 ? sub('0', difference) : '0';
  return { rise, fall };
}

export function reduceRiseFallRaw(input: ValidatedLevelingV2['input']): RawReductionResult {
  let rl = input.startRL;
  let previousReading = input.observations[0]?.bs ?? '0';
  const working: WorkingStep[] = [];
  const baseRows: BaseRow[] = [];
  const setupIndices: number[] = [];
  let currentSetup = 1;

  for (let i = 0; i < input.observations.length; i++) {
    const row = input.observations[i];
    if (!row) continue;
    if (i === 0) {
      setupIndices.push(0);
      baseRows.push(processFirstRow(row, rl));
      continue;
    }

    setupIndices.push(currentSetup);
    const incomingReading = row.is ?? row.fs ?? previousReading;
    const { rise, fall } = computeRiseFall(previousReading, incomingReading);
    const previousRL = rl;
    rl = add(rl, sub(rise, fall));

    working.push({
      ref: `observations.${i}.rl`,
      formulaKey: 'leveling.working.rl',
      variables: { previousRL, previousReading, incomingReading, rise, fall },
      result: rl,
    });

    const isCP = row.bs !== undefined && row.fs !== undefined;
    baseRows.push({
      station: row.station,
      remarks: row.remarks,
      bs: row.bs ?? null,
      is: row.is ?? null,
      fs: row.fs ?? null,
      rise,
      fall,
      rl,
      isChangePoint: isCP,
      dist: row.dist ?? null,
    });

    if (isCP) currentSetup++;
    previousReading = row.bs ?? row.is ?? incomingReading;
  }

  const sum = (key: 'rise' | 'fall') =>
    baseRows.reduce((total, row) => add(total, row[key] ?? '0'), '0');
  const sumRise = sum('rise');
  const sumFall = sum('fall');
  const riseFallDelta = sub(sumRise, sumFall);

  return {
    baseRows,
    working,
    endingRL: rl,
    setupIndices,
    setupsCount: currentSetup,
    sumRise,
    sumFall,
    riseFallDelta,
  };
}
