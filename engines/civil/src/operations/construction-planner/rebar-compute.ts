/**
 * Rebar cutting length and bar schedule calculation primitives.
 * Supports:
 * - Method A: IS 2502:1963 Hook & Bend Allowance (Table II, Table III, Table VIII, Cl. 5.1.1)
 * - Method B: Common Site Practice Bend Deductions (1d, 2d, 3d, 4d)
 */
import { div, mul } from '@mangotools/engine-numeric';
import {
  rebarTotalTonnes,
  rebarTotalWeightKg,
  rebarUnitWeightKgPerM,
} from '../../lib/rebar-weight.ts';
import type { CalculatedBarScheduleItem, IS2502KFactor, MemberType } from './types.ts';

export function roundToNearest5(val: number): number {
  return Math.round(val / 5) * 5;
}

export function ceilToMultipleOf25(val: number): number {
  return Math.ceil(val / 25) * 25;
}

export function is2502BendAllowance(k: IS2502KFactor, diameterMm: number): number {
  const mult = k === 2 ? 5 : k === 3 ? 5.5 : k === 4 ? 6 : 7;
  return Math.max(75, roundToNearest5(mult * diameterMm));
}

export function is2502HookAllowance(k: IS2502KFactor, diameterMm: number): number {
  const mult = k === 2 ? 9 : k === 3 ? 11 : k === 4 ? 13 : 17;
  return Math.max(75, roundToNearest5(mult * diameterMm));
}

export function stirrupHookExtension(
  diameterMm: number,
  hookAngle: 90 | 135 | 180,
  seismicHookMm?: number,
): number {
  if (hookAngle === 135 && seismicHookMm !== undefined && seismicHookMm > 0) {
    return seismicHookMm;
  }
  switch (hookAngle) {
    case 90:
      return 8 * diameterMm;
    case 135:
      return 6 * diameterMm;
    case 180:
      return 4 * diameterMm;
  }
}

export function computeUBentBarLengths(p: {
  clearSpanMm: number;
  legMm: number;
  dMm: number;
  isA: boolean;
  k: IS2502KFactor;
}): { calcMm: number; specifiedMm: number; dims: Record<string, string> } {
  if (p.isA) {
    const bA = is2502BendAllowance(p.k, p.dMm);
    const calcMm = p.clearSpanMm + 2 * bA;
    return {
      calcMm,
      specifiedMm: ceilToMultipleOf25(calcMm),
      dims: { span: String(p.clearSpanMm), bendAllowanceB: String(bA) },
    };
  }
  const calcMm = p.clearSpanMm + 2 * p.legMm - 4 * p.dMm;
  return {
    calcMm,
    specifiedMm: calcMm,
    dims: { span: String(p.clearSpanMm), leg: String(p.legMm) },
  };
}

export function computeLBentBarLengths(p: {
  straightLengthMm: number;
  extMm: number;
  dMm: number;
  isA: boolean;
  k: IS2502KFactor;
}): { calcMm: number; specifiedMm: number; dims: Record<string, string> } {
  if (p.isA) {
    // IS 2502:1963 Table III Ref No. D: standard end bend L = l + B
    const bA = is2502BendAllowance(p.k, p.dMm);
    const calcMm = p.straightLengthMm + bA;
    return {
      calcMm,
      specifiedMm: ceilToMultipleOf25(calcMm),
      dims: { length: String(p.straightLengthMm), bendAllowanceB: String(bA) },
    };
  }
  if (p.extMm <= 0) {
    return {
      calcMm: p.straightLengthMm,
      specifiedMm: p.straightLengthMm,
      dims: { length: String(p.straightLengthMm) },
    };
  }
  const calcMm = p.straightLengthMm + p.extMm - 2 * p.dMm;
  return {
    calcMm,
    specifiedMm: calcMm,
    dims: { length: String(p.straightLengthMm), extension: String(p.extMm) },
  };
}

export function computeClosedTieLengths(p: {
  widthMm: number;
  depthMm: number;
  coverMm: number;
  dMm: number;
  isA: boolean;
  hookAngle: 90 | 135 | 180;
  seismicHookMm?: number;
  methodBHookMm?: number;
}): { calcMm: number; specifiedMm: number; dims: Record<string, string> } {
  if (p.isA) {
    const eIn = p.widthMm - 2 * p.coverMm - 2 * p.dMm;
    const aIn = p.depthMm - 2 * p.coverMm - 2 * p.dMm;
    const calcMm = 2 * (aIn + eIn) + 24 * p.dMm;
    return {
      calcMm,
      specifiedMm: ceilToMultipleOf25(calcMm),
      dims: { A_inside: String(aIn), E_inside: String(eIn) },
    };
  }
  const aOut = p.widthMm - 2 * p.coverMm;
  const bOut = p.depthMm - 2 * p.coverMm;
  const hook = p.methodBHookMm ?? stirrupHookExtension(p.dMm, p.hookAngle, p.seismicHookMm);
  const ded = p.hookAngle === 135 ? 12 * p.dMm : 10 * p.dMm;
  const calcMm = 2 * (aOut + bOut) + 2 * hook - ded;
  return {
    calcMm,
    specifiedMm: calcMm,
    dims: { a_out: String(aOut), b_out: String(bOut), hook: String(hook) },
  };
}

export function methodLabel(method: string, k?: IS2502KFactor): string {
  return method === 'is2502-method-a'
    ? `Method: IS 2502 (k=${k ?? 3})`
    : 'Method: Site Practice Deductions';
}

export function buildBarScheduleItem(params: {
  barMark: string;
  memberId: string;
  memberLabel: string;
  memberType: MemberType;
  desc: string;
  dMm: number;
  calcCutMm: number;
  specifiedCutMm: number;
  barsPerMember: number;
  memberCount: number;
  methodLabel: string;
  shapeType: 'straight' | 'bent-up' | 'u-shape' | 'closed-tie' | 'l-shape';
  dims: Record<string, string>;
}): CalculatedBarScheduleItem {
  const dStr = String(params.dMm);
  const calcCutMmStr = String(Math.round(params.calcCutMm));
  const cutMmStr = String(Math.round(params.specifiedCutMm));
  const cutMStr = div(cutMmStr, '1000', 3);
  const totalBars = params.barsPerMember * params.memberCount;
  const totalLengthM = mul(cutMStr, String(totalBars));
  const unitWeight = rebarUnitWeightKgPerM(dStr);
  const totalKg = rebarTotalWeightKg(unitWeight, totalLengthM);
  return {
    barMark: params.barMark,
    memberId: params.memberId,
    memberLabel: params.memberLabel,
    memberType: params.memberType,
    description: params.desc,
    diameterMm: dStr,
    calculatedCuttingLengthMm: calcCutMmStr,
    singleBarCuttingLengthMm: cutMmStr,
    singleBarCuttingLengthM: cutMStr,
    barsPerMember: String(params.barsPerMember),
    totalBarCount: String(totalBars),
    totalLengthM,
    unitWeightKgPerM: unitWeight,
    totalWeightKg: totalKg,
    totalWeightTonnes: rebarTotalTonnes(totalKg),
    cuttingMethodLabel: params.methodLabel,
    shapeDetails: { shapeType: params.shapeType, dimensionsMm: params.dims },
  };
}
