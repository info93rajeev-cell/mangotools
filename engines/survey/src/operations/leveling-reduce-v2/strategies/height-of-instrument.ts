import type { WorkingStep } from '@mangotools/core';
import { add, sub } from '@mangotools/engine-numeric';
import type { ValidatedLevelingV2 } from '../validate.ts';
import type { BaseRow, RawReductionResult } from './types.ts';

function processFirstRow(
  row: ValidatedLevelingV2['input']['observations'][number],
  rl: string,
  hi: string,
): BaseRow {
  return {
    station: row.station,
    remarks: row.remarks,
    bs: row.bs ?? null,
    is: null,
    fs: null,
    hi,
    rise: null,
    fall: null,
    rl,
    isChangePoint: false,
    dist: row.dist ?? null,
  };
}

interface ChangePointStep {
  rl: string;
  newHI: string;
  working: [WorkingStep, WorkingStep];
  row: BaseRow;
}

function processChangePoint(
  row: ValidatedLevelingV2['input']['observations'][number],
  i: number,
  currentHI: string,
): ChangePointStep {
  const fs = row.fs ?? '0';
  const bs = row.bs ?? '0';
  const rl = sub(currentHI, fs);
  const newHI = add(rl, bs);
  const w1: WorkingStep = {
    ref: `observations.${i}.rl`,
    formulaKey: 'leveling.working.hi.rl',
    variables: { hi: currentHI, reading: fs },
    result: rl,
  };
  const w2: WorkingStep = {
    ref: `observations.${i}.hi`,
    formulaKey: 'leveling.working.hi.setup',
    variables: { rl, bs },
    result: newHI,
  };
  const baseRow: BaseRow = {
    station: row.station,
    remarks: row.remarks,
    bs: row.bs ?? null,
    is: null,
    fs: row.fs ?? null,
    hi: newHI,
    rise: null,
    fall: null,
    rl,
    isChangePoint: true,
    dist: row.dist ?? null,
  };
  return { rl, newHI, working: [w1, w2], row: baseRow };
}

function processSight(
  row: ValidatedLevelingV2['input']['observations'][number],
  i: number,
  currentHI: string,
): { rl: string; working: WorkingStep; row: BaseRow } {
  const reading = row.is ?? row.fs ?? '0';
  const rl = sub(currentHI, reading);
  const w: WorkingStep = {
    ref: `observations.${i}.rl`,
    formulaKey: 'leveling.working.hi.rl',
    variables: { hi: currentHI, reading },
    result: rl,
  };
  const baseRow: BaseRow = {
    station: row.station,
    remarks: row.remarks,
    bs: null,
    is: row.is ?? null,
    fs: row.fs ?? null,
    hi: null,
    rise: null,
    fall: null,
    rl,
    isChangePoint: false,
    dist: row.dist ?? null,
  };
  return { rl, working: w, row: baseRow };
}

export function reduceHeightOfInstrumentRaw(
  input: ValidatedLevelingV2['input'],
): RawReductionResult {
  let rl = input.startRL;
  let currentHI = '0';
  const working: WorkingStep[] = [];
  const baseRows: BaseRow[] = [];
  const setupIndices: number[] = [];
  let currentSetup = 1;

  for (let i = 0; i < input.observations.length; i++) {
    const row = input.observations[i];
    if (!row) continue;

    if (i === 0) {
      const bs = row.bs ?? '0';
      currentHI = add(rl, bs);
      setupIndices.push(0);
      working.push({
        ref: 'observations.0.hi',
        formulaKey: 'leveling.working.hi.setup',
        variables: { rl, bs },
        result: currentHI,
      });
      baseRows.push(processFirstRow(row, rl, currentHI));
      continue;
    }

    const isCP = row.bs !== undefined && row.fs !== undefined;
    setupIndices.push(currentSetup);

    if (isCP) {
      const cp = processChangePoint(row, i, currentHI);
      rl = cp.rl;
      currentHI = cp.newHI;
      working.push(...cp.working);
      baseRows.push(cp.row);
      currentSetup++;
    } else {
      const sight = processSight(row, i, currentHI);
      rl = sight.rl;
      working.push(sight.working);
      baseRows.push(sight.row);
    }
  }

  return {
    baseRows,
    working,
    endingRL: rl,
    setupIndices,
    setupsCount: currentSetup,
    sumRise: null,
    sumFall: null,
    riseFallDelta: null,
  };
}
