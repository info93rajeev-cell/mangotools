import { describe, expect, it } from 'vitest';
import { diffProjectRevisions, type RevisionDiff } from './project-diff.ts';
import type {
  ColumnMemberInput,
  ConstructionMemberInput,
  FootingMemberInput,
  TrackedValue,
} from './types.ts';

function tracked<T>(value: T): TrackedValue<T> {
  return { value, origin: 'typed', confirmedByUser: true };
}

function makeFooting(
  id: string,
  label: string,
  overrides: Partial<FootingMemberInput> = {},
): FootingMemberInput {
  return {
    id,
    label,
    memberType: 'footing',
    count: tracked(2),
    concreteGrade: tracked('M25'),
    steelGrade: tracked('Fe500'),
    clearCoverMm: tracked(50),
    cuttingMethod: tracked('is2502-method-a'),
    is2502KFactor: tracked(3),
    lengthMm: tracked(2000),
    widthMm: tracked(1500),
    depthMm: tracked(400),
    bottomMeshXBarDiameterMm: tracked(12),
    bottomMeshXSpacingMm: tracked(150),
    bottomMeshYBarDiameterMm: tracked(12),
    bottomMeshYSpacingMm: tracked(150),
    ...overrides,
  };
}

function makeColumn(
  id: string,
  label: string,
  overrides: Partial<ColumnMemberInput> = {},
): ColumnMemberInput {
  return {
    id,
    label,
    memberType: 'column',
    count: tracked(4),
    concreteGrade: tracked('M30'),
    steelGrade: tracked('Fe500'),
    clearCoverMm: tracked(40),
    cuttingMethod: tracked('site-practice-method-b'),
    widthMm: tracked(300),
    depthMm: tracked(450),
    heightMm: tracked(3200),
    mainBarDiameterMm: tracked(16),
    mainBarCount: tracked(6),
    tieDiameterMm: tracked(8),
    tieSpacingMm: tracked(150),
    tieHookAngle: tracked(135),
    methodBStirrupHookMm: tracked(100),
    ...overrides,
  };
}

describe('diffProjectRevisions', () => {
  it('returns all empty arrays when both revisions have no members', () => {
    const diff: RevisionDiff = diffProjectRevisions([], []);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([]);
    expect(diff.unchanged).toEqual([]);
  });

  it('detects added members when members exist only in new revision', () => {
    const f1 = makeFooting('f-1', 'F1');
    const diff = diffProjectRevisions([], [f1]);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]?.id).toBe('f-1');
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('detects removed members when members exist only in old revision', () => {
    const f1 = makeFooting('f-1', 'F1');
    const diff = diffProjectRevisions([f1], []);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]?.id).toBe('f-1');
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('detects unchanged members when all properties and values match', () => {
    const c1Old = makeColumn('c-1', 'C1');
    const c1New = makeColumn('c-1', 'C1');
    const diff = diffProjectRevisions([c1Old], [c1New]);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(1);
    expect(diff.unchanged[0]?.id).toBe('c-1');
  });

  it('detects property changes including label, dimensions, reinforcement, and cutting method', () => {
    const f1Old = makeFooting('f-1', 'F1');
    const f1New = makeFooting('f-1', 'F1-Revised', {
      count: tracked(4),
      concreteGrade: tracked('M30'),
      depthMm: tracked(500),
      cuttingMethod: tracked('site-practice-method-b'),
      bendLegHeightMm: tracked(250),
    });

    const diff = diffProjectRevisions([f1Old], [f1New]);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.unchanged).toHaveLength(0);
    expect(diff.changed).toHaveLength(1);

    const change = diff.changed[0];
    expect(change).toBeDefined();
    if (!change) return;
    expect(change.memberId).toBe('f-1');
    expect(change.label).toBe('F1-Revised');

    const props = change.changes.map((c) => c.property);
    expect(props).toContain('label');
    expect(props).toContain('count');
    expect(props).toContain('concreteGrade');
    expect(props).toContain('depthMm');
    expect(props).toContain('cuttingMethod');
    expect(props).toContain('bendLegHeightMm');

    const countChange = change.changes.find((c) => c.property === 'count');
    expect(countChange?.oldValue).toBe(2);
    expect(countChange?.newValue).toBe(4);
  });

  it('partitions a mixed revision into added, removed, changed, and unchanged cleanly', () => {
    const f1Old = makeFooting('f-1', 'F1');
    const c1Old = makeColumn('c-1', 'C1');
    const c2Old = makeColumn('c-2', 'C2');

    // In new revision:
    // f-1 is unchanged
    // c-1 is changed (mainBarCount 6 -> 8)
    // c-2 is removed
    // c-3 is added
    const f1New = makeFooting('f-1', 'F1');
    const c1New = makeColumn('c-1', 'C1', { mainBarCount: tracked(8) });
    const c3New = makeColumn('c-3', 'C3');

    const oldMembers: ConstructionMemberInput[] = [f1Old, c1Old, c2Old];
    const newMembers: ConstructionMemberInput[] = [f1New, c1New, c3New];

    const diff = diffProjectRevisions(oldMembers, newMembers);

    expect(diff.added.map((m) => m.id)).toEqual(['c-3']);
    expect(diff.removed.map((m) => m.id)).toEqual(['c-2']);
    expect(diff.changed.map((m) => m.memberId)).toEqual(['c-1']);
    expect(diff.unchanged.map((m) => m.id)).toEqual(['f-1']);

    // Check that changed details match
    const c1Diff = diff.changed[0];
    expect(c1Diff).toBeDefined();
    if (!c1Diff) return;
    expect(c1Diff.changes).toHaveLength(1);
    expect(c1Diff.changes[0]).toEqual({
      property: 'mainBarCount',
      oldValue: 6,
      newValue: 8,
    });
  });

  describe('Quantity Diff (Fix 8: project, member, and BBS quantities with units)', () => {
    it('computes old vs new concrete volume, rebar weight by diameter, and BBS rows', () => {
      // Old revision: 1 footing (2000 x 1500 x 400 mm, count 2)
      const f1Old = makeFooting('f-1', 'F1');
      // New revision: Footing depth increased from 400 to 500 mm + 1 Column added (count 4, 6 bars dia 16)
      const f1New = makeFooting('f-1', 'F1', { depthMm: tracked(500) });
      const c1New = makeColumn('c-1', 'C1');

      const diff = diffProjectRevisions([f1Old], [f1New, c1New]);

      expect(diff.quantities).toBeDefined();

      // 1. Project level quantities diff
      const pDiff = diff.quantities.project;
      expect(pDiff.concreteVolume.unit).toBe('m³');
      expect(Number(pDiff.concreteVolume.oldValue)).toBeGreaterThan(0);
      expect(Number(pDiff.concreteVolume.newValue)).toBeGreaterThan(
        Number(pDiff.concreteVolume.oldValue),
      );
      expect(Number(pDiff.concreteVolume.delta)).toBeGreaterThan(0);

      expect(pDiff.totalRebarWeight.unit).toBe('kg');
      expect(Number(pDiff.totalRebarWeight.oldValue)).toBeGreaterThan(0);
      expect(Number(pDiff.totalRebarWeight.newValue)).toBeGreaterThan(
        Number(pDiff.totalRebarWeight.oldValue),
      );
      expect(Number(pDiff.totalRebarWeight.delta)).toBeGreaterThan(0);

      // Steel weight by diameter
      expect(pDiff.steelWeightByDiameter.length).toBeGreaterThan(0);
      for (const d of pDiff.steelWeightByDiameter) {
        expect(d.unit).toBe('kg');
        expect(['8', '12', '16']).toContain(d.diameterMm);
      }

      // 2. Member level quantities diff
      expect(diff.quantities.members).toHaveLength(2);
      const f1Qty = diff.quantities.members.find((m) => m.memberId === 'f-1');
      expect(f1Qty).toBeDefined();
      expect(f1Qty?.concreteVolume.unit).toBe('m³');
      expect(f1Qty?.rebarWeight.unit).toBe('kg');
      expect(Number(f1Qty?.concreteVolume.delta)).toBeGreaterThan(0); // 400mm -> 500mm depth increased concrete

      const c1Qty = diff.quantities.members.find((m) => m.memberId === 'c-1');
      expect(c1Qty).toBeDefined();
      expect(c1Qty?.concreteVolume.oldValue).toBe('0');
      expect(Number(c1Qty?.concreteVolume.newValue)).toBeGreaterThan(0);

      // 3. BBS rows diff matched by stable bar-mark ID
      const bbs = diff.quantities.bbs;
      expect(bbs.added.length).toBeGreaterThan(0); // Column bars are added
      expect(bbs.added.some((b) => b.barMark.startsWith('C1'))).toBe(true);
      expect(bbs.removed).toEqual([]); // No bars removed
      expect(bbs.unchanged.length).toBeGreaterThanOrEqual(0);
    });
  });
});
