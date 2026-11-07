import type { Check } from '@mangotools/core';
import { add, compare, div, mul, sub, toFixedString } from '@mangotools/engine-numeric';
import type { LevelingOutputV2 } from './schema.ts';
import { reduceHeightOfInstrumentRaw } from './strategies/height-of-instrument.ts';
import { reduceRiseFallRaw } from './strategies/rise-fall.ts';
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

function buildChecks(
  method: string,
  bsFsDelta: string,
  rlDelta: string,
  riseFallDelta: string | null,
): LevelingOutputV2['checks'] {
  if (method === 'height-of-instrument') {
    return [check('firstLast', bsFsDelta, rlDelta)];
  }
  return [
    check('riseFall', bsFsDelta, riseFallDelta ?? '0'),
    check('firstLast', bsFsDelta, rlDelta),
  ];
}

function buildAdjConfig(
  params: ValidatedLevelingV2['params'],
  input: ValidatedLevelingV2['input'],
  misclosure: string | null,
  cumulativeDistances: string[] | undefined,
  setupIndices: number[],
  setupsCount: number,
  lastIndex: number,
): AdjConfig {
  return {
    adjBy: input.closingRL !== undefined ? params.adjBy : 'none',
    misclosure,
    startRL: input.startRL,
    closingRL: input.closingRL,
    totalDistance: input.totalDistance,
    cumulativeDistances,
    setupIndices,
    setupsCount,
    lastIndex,
  };
}

export function reduceV2(validated: ValidatedLevelingV2): LevelingOutputV2 {
  const { input, params } = validated;
  const raw =
    params.method === 'height-of-instrument'
      ? reduceHeightOfInstrumentRaw(input)
      : reduceRiseFallRaw(input);

  const sum = (key: 'bs' | 'fs') =>
    raw.baseRows.reduce((total, row) => add(total, row[key] ?? '0'), '0');
  const sumBS = sum('bs');
  const sumFS = sum('fs');
  const bsFsDelta = sub(sumBS, sumFS);
  const rlDelta = sub(raw.endingRL, input.startRL);

  const cumulativeDistances = input.normalizedDistances
    ? computeCumulative(input.normalizedDistances)
    : undefined;
  const totalDistanceKm = input.totalDistance
    ? toFixedString(div(input.totalDistance, '1000', 6), 3)
    : null;

  const { misclosure, allowableError, closureStatus } = evaluateClosure(
    raw.endingRL,
    input.closingRL,
    params.kConstant,
    input.totalDistance,
  );

  const cfg = buildAdjConfig(
    params,
    input,
    misclosure,
    cumulativeDistances,
    raw.setupIndices,
    raw.setupsCount,
    raw.baseRows.length - 1,
  );

  const rows: LevelingOutputV2['rows'] = raw.baseRows.map((row, i) => {
    const { corr, adjustedRL } = computeCorrectionAndRL(i, row.rl, cfg);
    return { ...row, corr, adjustedRL };
  });

  return {
    rows,
    startingRL: input.startRL,
    endingRL: raw.endingRL,
    sumBS,
    sumFS,
    sumRise: raw.sumRise,
    sumFall: raw.sumFall,
    bsFsDelta,
    riseFallDelta: raw.riseFallDelta,
    rlDelta,
    closingRL: input.closingRL ?? null,
    misclosure,
    checks: buildChecks(params.method, bsFsDelta, rlDelta, raw.riseFallDelta),
    working: raw.working,
    totalDistanceKm,
    allowableError,
    closureStatus,
    setupsCount: raw.setupsCount,
  };
}
