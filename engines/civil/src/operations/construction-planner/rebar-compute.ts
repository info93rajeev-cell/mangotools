/**
 * Rebar cutting length and bar schedule calculation primitives.
 * Supports:
 * - Method A: IS 2502:1963 Hook & Bend Allowance (with explicit user-selected factor k in {2, 3, 4, 6})
 * - Method B: Common Site Practice Bend Deductions (1d, 2d, 3d, 4d)
 */
import { div, mul } from '@mangotools/engine-numeric';
import {
  rebarTotalTonnes,
  rebarTotalWeightKg,
  rebarUnitWeightKgPerM,
} from '../../lib/rebar-weight.ts';
import type { CalculatedBarScheduleItem, IS2502KFactor, MemberType } from './types.ts';

export function ceilToMultipleOf5(val: number): number {
  return Math.ceil(val / 5) * 5;
}

export function is2502BendAllowance(k: IS2502KFactor, diameterMm: number): number {
  const raw = (k + 1) * (Math.PI / 4) * diameterMm;
  return ceilToMultipleOf5(raw);
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

export function computeUBentBarCutMm(
  baseMm: number,
  legMm: number,
  dMm: number,
  isA: boolean,
  k: IS2502KFactor,
): number {
  const bA = isA ? is2502BendAllowance(k, dMm) : 0;
  return isA ? baseMm + 2 * legMm + 2 * bA : baseMm + 2 * legMm - 4 * dMm;
}

export function computeClosedTieCutMm(
  aMm: number,
  bMm: number,
  dMm: number,
  hookAngle: 90 | 135 | 180,
  seismicHookMm: number | undefined,
  isA: boolean,
): number {
  const ext = stirrupHookExtension(dMm, hookAngle, seismicHookMm);
  const hook = isA ? ceilToMultipleOf5(ext) : ext;
  const ded = hookAngle === 135 ? 12 * dMm : 10 * dMm;
  return isA ? 2 * (aMm + bMm) + 2 * hook : 2 * (aMm + bMm) + 2 * ext - ded;
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
  cutMm: number;
  barsPerMember: number;
  memberCount: number;
  methodLabel: string;
  shapeType: 'straight' | 'bent-up' | 'u-shape' | 'closed-tie' | 'l-shape';
  dims: Record<string, string>;
}): CalculatedBarScheduleItem {
  const dStr = String(params.dMm);
  const cutMmStr = String(Math.round(params.cutMm));
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
