import type { Check, WorkingStep } from '@mangotools/core';
import { add, compare, div, mul, sub, toFixedString } from '@mangotools/engine-numeric';
import type { LevelingOutputV2 } from './schema.ts';
import type { ValidatedLevelingV2 } from './validate.ts';

function check(id: string, expected: string, actual: string): LevelingOutputV2['checks'][number] {
  return {
    id: `arithmetic-${id === 'riseFall' ? 'rise-fall' : 'first-last'}`,
    labelKey: `leveling.check.${id}`,
    status: compare(expected, actual) === 0 ? 'pass' : 'fail',
    expected,
    actual,
  } satisfies Check;
}

interface BaseRow {
  station?: string;
  remarks?: string;
  bs: string | null;
  is: string | null;
  fs: string | null;
  rise: string | null;
  fall: string | null;
  rl: string;
  isChangePoint: boolean;
  dist: string | null;
}

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

function reduceRawRows(input: ValidatedLevelingV2['input']) {
  let rl = input.startRL;
  let previousReading = input.observations[0]?.bs ?? '0';
  const working: LevelingOutputV2['working'] = [];
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
    } satisfies WorkingStep);

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

  return { baseRows, working, endingRL: rl, setupIndices, setupsCount: currentSetup };
}

function computeCumulative(normalizedDistances: string[]): string[] {
  let cum = '0';
  const res: string[] = [];
  for (const d of normalizedDistances) {
    cum = add(cum, d);
    res.push(cum);
  }
  return res;
}

function evaluateClosure(
  endingRL: string,
  closingRL?: string,
  kConstant?: string,
  totalDistance?: string,
) {
  if (closingRL === undefined) {
    return { misclosure: null, allowableError: null, closureStatus: null };
  }
  const misclosure = sub(endingRL, closingRL);
  if (!kConstant) {
    return { misclosure, allowableError: null, closureStatus: 'criterion-not-provided' as const };
  }
  if (!totalDistance) {
    return { misclosure, allowableError: null, closureStatus: 'distance-not-provided' as const };
  }
  const cNum = Number(kConstant);
  const kNum = Number(totalDistance) / 1000;
  const limit = cNum * Math.sqrt(kNum);
  const eMm = Math.abs(Number(misclosure) * 1000);
  const closureStatus = eMm <= limit + 1e-9 ? ('pass' as const) : ('fail' as const);
  const allowableError = toFixedString(limit.toString(), 1);
  return { misclosure, allowableError, closureStatus };
}

interface AdjConfig {
  adjBy: 'none' | 'distance' | 'setup';
  misclosure: string | null;
  startRL: string;
  closingRL?: string;
  totalDistance?: string;
  cumulativeDistances?: string[];
  setupIndices: number[];
  setupsCount: number;
  lastIndex: number;
}

function computeCorrectionAndRL(i: number, rowRL: string, cfg: AdjConfig) {
  if (cfg.misclosure === null || cfg.adjBy === 'none') {
    return { corr: null, adjustedRL: null };
  }
  if (i === 0) {
    return { corr: '0.0', adjustedRL: toFixedString(cfg.startRL, 3) };
  }
  if (i === cfg.lastIndex && cfg.closingRL !== undefined) {
    const cMm = mul(sub('0', cfg.misclosure), '1000');
    const formatted = toFixedString(cMm, 1);
    const corr = compare(formatted, '0') > 0 ? `+${formatted}` : formatted;
    return { corr, adjustedRL: toFixedString(cfg.closingRL, 3) };
  }

  let ratio: string | undefined;
  if (cfg.adjBy === 'distance' && cfg.cumulativeDistances && cfg.totalDistance) {
    const cum = cfg.cumulativeDistances[i] ?? '0';
    ratio = div(cum, cfg.totalDistance, 20);
  } else if (cfg.adjBy === 'setup') {
    const s = (cfg.setupIndices[i] ?? 0).toString();
    ratio = div(s, cfg.setupsCount.toString(), 20);
  }

  if (!ratio) return { corr: null, adjustedRL: null };
  const cM = mul(sub('0', cfg.misclosure), ratio);
  const cMm = mul(cM, '1000');
  const formatted = toFixedString(cMm, 1);
  const corr = compare(formatted, '0') > 0 ? `+${formatted}` : formatted;
  const adjustedRL = toFixedString(add(rowRL, cM), 3);
  return { corr, adjustedRL };
}

export function reduceV2(validated: ValidatedLevelingV2): LevelingOutputV2 {
  const { input, params } = validated;
  const { baseRows, working, endingRL, setupIndices, setupsCount } = reduceRawRows(input);

  const sum = (key: 'bs' | 'fs' | 'rise' | 'fall') =>
    baseRows.reduce((total, row) => add(total, row[key] ?? '0'), '0');
  const sumBS = sum('bs');
  const sumFS = sum('fs');
  const sumRise = sum('rise');
  const sumFall = sum('fall');
  const bsFsDelta = sub(sumBS, sumFS);
  const riseFallDelta = sub(sumRise, sumFall);
  const rlDelta = sub(endingRL, input.startRL);

  const cumulativeDistances = input.normalizedDistances
    ? computeCumulative(input.normalizedDistances)
    : undefined;
  const totalDistanceKm = input.totalDistance
    ? toFixedString(div(input.totalDistance, '1000', 6), 3)
    : null;

  const { misclosure, allowableError, closureStatus } = evaluateClosure(
    endingRL,
    input.closingRL,
    params.kConstant,
    input.totalDistance,
  );

  const effectiveAdjBy = input.closingRL !== undefined ? params.adjBy : 'none';
  const cfg: AdjConfig = {
    adjBy: effectiveAdjBy,
    misclosure,
    startRL: input.startRL,
    closingRL: input.closingRL,
    totalDistance: input.totalDistance,
    cumulativeDistances,
    setupIndices,
    setupsCount,
    lastIndex: baseRows.length - 1,
  };

  const rows: LevelingOutputV2['rows'] = baseRows.map((row, i) => {
    const { corr, adjustedRL } = computeCorrectionAndRL(i, row.rl, cfg);
    return { ...row, corr, adjustedRL };
  });

  return {
    rows,
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
    misclosure,
    checks: [check('riseFall', bsFsDelta, riseFallDelta), check('firstLast', bsFsDelta, rlDelta)],
    working,
    totalDistanceKm,
    allowableError,
    closureStatus,
    setupsCount,
  };
}
