/**
 * Aggregates Bar Bending Schedule (BBS) items and computes summaries:
 * - by rebar diameter
 * - by member type
 * - by concrete grade
 * - overall totals
 */
import { add } from '@mangotools/engine-numeric';
import { rebarTotalTonnes } from '../../lib/rebar-weight.ts';
import type {
  CalculatedBarScheduleItem,
  ConcreteGradeSummary,
  MemberCalculationResult,
  MemberType,
  MemberTypeSummary,
  RebarDiameterSummary,
} from './types.ts';

export function summarizeByDiameter(items: CalculatedBarScheduleItem[]): RebarDiameterSummary[] {
  const map = new Map<string, { lengthM: string; weightKg: string }>();

  for (const it of items) {
    const existing = map.get(it.diameterMm);
    if (!existing) {
      map.set(it.diameterMm, { lengthM: it.totalLengthM, weightKg: it.totalWeightKg });
    } else {
      map.set(it.diameterMm, {
        lengthM: add(existing.lengthM, it.totalLengthM),
        weightKg: add(existing.weightKg, it.totalWeightKg),
      });
    }
  }

  // Sort by numeric diameter ascending
  const sortedDiameters = Array.from(map.keys()).sort((a, b) => Number(a) - Number(b));
  return sortedDiameters.map((d) => {
    const data = map.get(d);
    const lengthM = data?.lengthM ?? '0';
    const weightKg = data?.weightKg ?? '0';
    return {
      diameterMm: d,
      totalLengthM: lengthM,
      totalWeightKg: weightKg,
      totalWeightTonnes: rebarTotalTonnes(weightKg),
    };
  });
}

export function summarizeByMemberType(members: MemberCalculationResult[]): MemberTypeSummary[] {
  const map = new Map<MemberType, { volM3: string; weightKg: string }>();

  for (const m of members) {
    const existing = map.get(m.memberType);
    if (!existing) {
      map.set(m.memberType, { volM3: m.totalConcreteVolumeM3, weightKg: m.totalRebarWeightKg });
    } else {
      map.set(m.memberType, {
        volM3: add(existing.volM3, m.totalConcreteVolumeM3),
        weightKg: add(existing.weightKg, m.totalRebarWeightKg),
      });
    }
  }

  return Array.from(map.entries()).map(([mType, data]) => ({
    memberType: mType,
    concreteVolumeM3: data.volM3,
    totalRebarWeightKg: data.weightKg,
    totalRebarWeightTonnes: rebarTotalTonnes(data.weightKg),
  }));
}

export function summarizeByConcreteGrade(
  members: MemberCalculationResult[],
): ConcreteGradeSummary[] {
  const map = new Map<string, string>();

  for (const m of members) {
    const existing = map.get(m.concreteGrade);
    if (!existing) {
      map.set(m.concreteGrade, m.totalConcreteVolumeM3);
    } else {
      map.set(m.concreteGrade, add(existing, m.totalConcreteVolumeM3));
    }
  }

  return Array.from(map.entries()).map(([grade, volume]) => ({
    concreteGrade: grade,
    volumeM3: volume,
  }));
}
