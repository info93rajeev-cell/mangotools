/**
 * Quantity revision diff engine for Construction Project Planner.
 * Computes old vs new concrete volume, rebar weight by diameter,
 * and BBS rows matched by stable bar-mark ID with explicit units.
 */

import { sub } from '@mangotools/engine-numeric';
import type {
  CalculatedBarScheduleItem,
  ConstructionPlannerEngineOutput,
  MemberType,
} from './types.ts';

export interface QuantityValueWithUnit {
  oldValue: string;
  newValue: string;
  delta: string;
  unit: string;
}

export interface SteelWeightByDiameterDiff {
  diameterMm: string;
  oldWeightKg: string;
  newWeightKg: string;
  deltaKg: string;
  unit: 'kg';
}

export interface ProjectQuantityDiff {
  concreteVolume: QuantityValueWithUnit;
  totalRebarWeight: QuantityValueWithUnit;
  totalRebarWeightTonnes: QuantityValueWithUnit;
  steelWeightByDiameter: SteelWeightByDiameterDiff[];
}

export interface MemberQuantityDiff {
  memberId: string;
  memberLabel: string;
  memberType: MemberType;
  concreteVolume: QuantityValueWithUnit;
  rebarWeight: QuantityValueWithUnit;
}

export interface BbsRowDiffChange {
  property: string;
  oldValue: string;
  newValue: string;
  unit?: string;
}

export interface BbsRevisionDiff {
  added: CalculatedBarScheduleItem[];
  removed: CalculatedBarScheduleItem[];
  changed: {
    barMark: string;
    memberId: string;
    description: string;
    diameterMm: string;
    oldItem: CalculatedBarScheduleItem;
    newItem: CalculatedBarScheduleItem;
    changes: BbsRowDiffChange[];
  }[];
  unchanged: CalculatedBarScheduleItem[];
}

function makeQuantity(oldValue: string, newValue: string, unit: string): QuantityValueWithUnit {
  return {
    oldValue,
    newValue,
    delta: sub(newValue, oldValue),
    unit,
  };
}

export function diffProjectQuantities(
  oldOutput: ConstructionPlannerEngineOutput,
  newOutput: ConstructionPlannerEngineOutput,
): ProjectQuantityDiff {
  const concreteVolume = makeQuantity(
    oldOutput.totalConcreteVolumeM3,
    newOutput.totalConcreteVolumeM3,
    'm³',
  );
  const totalRebarWeight = makeQuantity(
    oldOutput.totalRebarWeightKg,
    newOutput.totalRebarWeightKg,
    'kg',
  );
  const totalRebarWeightTonnes = makeQuantity(
    oldOutput.totalRebarWeightTonnes,
    newOutput.totalRebarWeightTonnes,
    'tonnes',
  );

  const oldDiaMap = new Map(
    oldOutput.summaryByDiameter.map((d) => [d.diameterMm, d.totalWeightKg]),
  );
  const newDiaMap = new Map(
    newOutput.summaryByDiameter.map((d) => [d.diameterMm, d.totalWeightKg]),
  );

  const allDias = Array.from(new Set([...oldDiaMap.keys(), ...newDiaMap.keys()])).sort(
    (a, b) => Number(a) - Number(b),
  );

  const steelWeightByDiameter: SteelWeightByDiameterDiff[] = allDias.map((dia) => {
    const oldWeight = oldDiaMap.get(dia) ?? '0';
    const newWeight = newDiaMap.get(dia) ?? '0';
    return {
      diameterMm: dia,
      oldWeightKg: oldWeight,
      newWeightKg: newWeight,
      deltaKg: sub(newWeight, oldWeight),
      unit: 'kg',
    };
  });

  return {
    concreteVolume,
    totalRebarWeight,
    totalRebarWeightTonnes,
    steelWeightByDiameter,
  };
}

export function diffMemberQuantities(
  oldOutput: ConstructionPlannerEngineOutput,
  newOutput: ConstructionPlannerEngineOutput,
): MemberQuantityDiff[] {
  const oldMap = new Map(oldOutput.members.map((m) => [m.memberId, m]));
  const newMap = new Map(newOutput.members.map((m) => [m.memberId, m]));

  const allIds = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));
  return allIds.map((id) => {
    const oldM = oldMap.get(id);
    const newM = newMap.get(id);
    const memberLabel = newM?.memberLabel ?? oldM?.memberLabel ?? '';
    const memberType = newM?.memberType ?? oldM?.memberType ?? 'footing';

    return {
      memberId: id,
      memberLabel,
      memberType,
      concreteVolume: makeQuantity(
        oldM?.totalConcreteVolumeM3 ?? '0',
        newM?.totalConcreteVolumeM3 ?? '0',
        'm³',
      ),
      rebarWeight: makeQuantity(
        oldM?.totalRebarWeightKg ?? '0',
        newM?.totalRebarWeightKg ?? '0',
        'kg',
      ),
    };
  });
}

function compareBbsItem(
  oldItem: CalculatedBarScheduleItem,
  newItem: CalculatedBarScheduleItem,
): BbsRowDiffChange[] {
  const changes: BbsRowDiffChange[] = [];
  if (oldItem.singleBarCuttingLengthMm !== newItem.singleBarCuttingLengthMm) {
    changes.push({
      property: 'singleBarCuttingLengthMm',
      oldValue: oldItem.singleBarCuttingLengthMm,
      newValue: newItem.singleBarCuttingLengthMm,
      unit: 'mm',
    });
  }
  if (oldItem.totalBarCount !== newItem.totalBarCount) {
    changes.push({
      property: 'totalBarCount',
      oldValue: oldItem.totalBarCount,
      newValue: newItem.totalBarCount,
      unit: 'count',
    });
  }
  if (oldItem.totalLengthM !== newItem.totalLengthM) {
    changes.push({
      property: 'totalLengthM',
      oldValue: oldItem.totalLengthM,
      newValue: newItem.totalLengthM,
      unit: 'm',
    });
  }
  if (oldItem.totalWeightKg !== newItem.totalWeightKg) {
    changes.push({
      property: 'totalWeightKg',
      oldValue: oldItem.totalWeightKg,
      newValue: newItem.totalWeightKg,
      unit: 'kg',
    });
  }
  return changes;
}

export function diffBbsRows(
  oldItems: CalculatedBarScheduleItem[],
  newItems: CalculatedBarScheduleItem[],
): BbsRevisionDiff {
  const oldMap = new Map(oldItems.map((b) => [b.barMark, b]));
  const newMap = new Map(newItems.map((b) => [b.barMark, b]));

  const added: CalculatedBarScheduleItem[] = [];
  const removed: CalculatedBarScheduleItem[] = [];
  const changed: BbsRevisionDiff['changed'] = [];
  const unchanged: CalculatedBarScheduleItem[] = [];

  for (const newItem of newItems) {
    const oldItem = oldMap.get(newItem.barMark);
    if (!oldItem) {
      added.push(newItem);
      continue;
    }

    const changes = compareBbsItem(oldItem, newItem);
    if (changes.length > 0) {
      changed.push({
        barMark: newItem.barMark,
        memberId: newItem.memberId,
        description: newItem.description,
        diameterMm: newItem.diameterMm,
        oldItem,
        newItem,
        changes,
      });
    } else {
      unchanged.push(newItem);
    }
  }

  for (const oldItem of oldItems) {
    if (!newMap.has(oldItem.barMark)) {
      removed.push(oldItem);
    }
  }

  return { added, removed, changed, unchanged };
}
