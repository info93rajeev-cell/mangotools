import type { Check, WorkingStep } from '@mangotools/core';
import { add, compare, sub } from '@mangotools/engine-numeric';
import type { LevelingInput, LevelingOutput } from './schema.ts';

function check(id: string, expected: string, actual: string): LevelingOutput['checks'][number] {
  return {
    id: `arithmetic-${id === 'riseFall' ? 'rise-fall' : 'first-last'}`,
    labelKey: `leveling.check.${id}`,
    status: compare(expected, actual) === 0 ? 'pass' : 'fail',
    expected,
    actual,
  } satisfies Check;
}

function resultRow(
  row: LevelingInput['observations'][number],
  step: { rise: string; fall: string; rl: string },
  index: number,
): LevelingOutput['rows'][number] {
  return {
    ...row,
    bs: row.bs ?? null,
    is: row.is ?? null,
    fs: row.fs ?? null,
    rise: index === 0 ? null : step.rise,
    fall: index === 0 ? null : step.fall,
    rl: step.rl,
    isChangePoint: index > 0 && row.bs !== undefined && row.fs !== undefined,
  };
}

function reduceRows(input: LevelingInput & { startRL: string }) {
  let rl = input.startRL;
  let previousReading = input.observations[0]?.bs ?? '0';
  const working: LevelingOutput['working'] = [];
  const rows = input.observations.map((row, i) => {
    const incomingReading = row.is ?? row.fs ?? previousReading;
    const difference = sub(previousReading, incomingReading);
    const rise = compare(difference, '0') > 0 ? difference : '0';
    const fall = compare(difference, '0') < 0 ? sub('0', difference) : '0';
    const previousRL = rl;
    rl = add(rl, sub(rise, fall));
    if (i > 0)
      working.push({
        ref: `observations.${i}.rl`,
        formulaKey: 'leveling.working.rl',
        variables: { previousRL, previousReading, incomingReading, rise, fall },
        result: rl,
      } satisfies WorkingStep);
    // Outgoing BS starts the next setup; it is never compared with this row's FS.
    previousReading = row.bs ?? row.is ?? incomingReading;
    return resultRow(row, { rise, fall, rl }, i);
  });
  return { rows, working, endingRL: rl };
}

export function reduce(input: LevelingInput & { startRL: string }): LevelingOutput {
  const { rows, working, endingRL } = reduceRows(input);
  const sum = (key: 'bs' | 'fs' | 'rise' | 'fall') =>
    rows.reduce((total, row) => add(total, row[key] ?? '0'), '0');
  const sumBS = sum('bs');
  const sumFS = sum('fs');
  const sumRise = sum('rise');
  const sumFall = sum('fall');
  const bsFsDelta = sub(sumBS, sumFS);
  const riseFallDelta = sub(sumRise, sumFall);
  const rlDelta = sub(endingRL, input.startRL);
  return {
    rows,
    working,
    startingRL: input.startRL,
    endingRL,
    sumBS,
    sumFS,
    sumRise,
    sumFall,
    bsFsDelta,
    riseFallDelta,
    rlDelta,
    closingRL: input.closingRL ?? null,
    misclosure: input.closingRL === undefined ? null : sub(endingRL, input.closingRL),
    checks: [check('riseFall', bsFsDelta, riseFallDelta), check('firstLast', bsFsDelta, rlDelta)],
  };
}
