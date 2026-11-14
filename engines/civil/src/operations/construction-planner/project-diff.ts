/**
 * Deterministic revision diff algorithm for Construction Project Planner.
 * Compares member revisions by stable member IDs into added, removed, changed, and unchanged.
 */

import type { ConstructionMemberInput, MemberType, TrackedValue } from './types.ts';

export interface PropertyChange {
  property: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface MemberChange {
  memberId: string;
  memberType: MemberType;
  label: string;
  changes: PropertyChange[];
}

export interface RevisionDiff {
  added: ConstructionMemberInput[];
  removed: ConstructionMemberInput[];
  changed: MemberChange[];
  unchanged: ConstructionMemberInput[];
}

function isTrackedValue(obj: unknown): obj is TrackedValue<unknown> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'value' in obj &&
    'origin' in obj &&
    'confirmedByUser' in obj
  );
}

function compareTrackedOrRaw(
  property: string,
  oldVal: unknown,
  newVal: unknown,
  changes: PropertyChange[],
): void {
  if (oldVal === undefined && newVal === undefined) return;

  if (oldVal === undefined || newVal === undefined) {
    const oldV = isTrackedValue(oldVal) ? oldVal.value : oldVal;
    const newV = isTrackedValue(newVal) ? newVal.value : newVal;
    changes.push({ property, oldValue: oldV, newValue: newV });
    return;
  }

  const oldV = isTrackedValue(oldVal) ? oldVal.value : oldVal;
  const newV = isTrackedValue(newVal) ? newVal.value : newVal;

  if (oldV !== newV) {
    changes.push({ property, oldValue: oldV, newValue: newV });
  }
}

function compareMembers(
  oldMember: ConstructionMemberInput,
  newMember: ConstructionMemberInput,
): PropertyChange[] {
  const changes: PropertyChange[] = [];

  if (oldMember.label !== newMember.label) {
    changes.push({
      property: 'label',
      oldValue: oldMember.label,
      newValue: newMember.label,
    });
  }

  if (oldMember.memberType !== newMember.memberType) {
    changes.push({
      property: 'memberType',
      oldValue: oldMember.memberType,
      newValue: newMember.memberType,
    });
  }

  const allKeys = new Set([...Object.keys(oldMember), ...Object.keys(newMember)]);
  allKeys.delete('id');
  allKeys.delete('label');
  allKeys.delete('memberType');

  const oldRec = oldMember as unknown as Record<string, unknown>;
  const newRec = newMember as unknown as Record<string, unknown>;

  for (const key of Array.from(allKeys).sort()) {
    compareTrackedOrRaw(key, oldRec[key], newRec[key], changes);
  }

  return changes;
}

/**
 * Computes deterministic diff between old and new revisions by stable member ID.
 * Returns members partitioned into added, removed, changed (with details), and unchanged.
 */
export function diffProjectRevisions(
  oldMembers: ConstructionMemberInput[],
  newMembers: ConstructionMemberInput[],
): RevisionDiff {
  const oldMap = new Map<string, ConstructionMemberInput>();
  for (const m of oldMembers) {
    oldMap.set(m.id, m);
  }

  const newMap = new Map<string, ConstructionMemberInput>();
  for (const m of newMembers) {
    newMap.set(m.id, m);
  }

  const added: ConstructionMemberInput[] = [];
  const removed: ConstructionMemberInput[] = [];
  const changed: MemberChange[] = [];
  const unchanged: ConstructionMemberInput[] = [];

  for (const newMember of newMembers) {
    const oldMember = oldMap.get(newMember.id);
    if (!oldMember) {
      added.push(newMember);
      continue;
    }

    const propChanges = compareMembers(oldMember, newMember);
    if (propChanges.length > 0) {
      changed.push({
        memberId: newMember.id,
        memberType: newMember.memberType,
        label: newMember.label,
        changes: propChanges,
      });
    } else {
      unchanged.push(newMember);
    }
  }

  for (const oldMember of oldMembers) {
    if (!newMap.has(oldMember.id)) {
      removed.push(oldMember);
    }
  }

  return { added, removed, changed, unchanged };
}
