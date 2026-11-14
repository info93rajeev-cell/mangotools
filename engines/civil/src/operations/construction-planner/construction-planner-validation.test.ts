/**
 * Construction Project Planner - Validation, Provenance & Multi-Member Aggregation Tests.
 */
import { describe, expect, it } from 'vitest';
import { constructionPlanner } from './operation.ts';
import { constructionPlannerInput } from './schema.ts';
import type {
  BeamMemberInput,
  CalculatedBarScheduleItem,
  ColumnMemberInput,
  FootingMemberInput,
  SlabZoneMemberInput,
  TrackedValue,
} from './types.ts';

function tracked<T>(val: T): TrackedValue<T> {
  return { value: val, origin: 'typed', confirmedByUser: true };
}

function getItem(items: CalculatedBarScheduleItem[], mark: string): CalculatedBarScheduleItem {
  const found = items.find((b) => b.barMark === mark);
  expect(found).toBeDefined();
  if (!found) throw new Error(`Bar mark ${mark} not found`);
  return found;
}

describe('Construction Planner - Validation, Provenance & Aggregation', () => {
  it('strictly rejects unconfirmed values (confirmedByUser = false)', () => {
    const unconfirmedFooting = {
      id: 'f1',
      label: 'F1',
      memberType: 'footing',
      count: tracked(1),
      concreteGrade: tracked('M25'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(50),
      cuttingMethod: tracked('is2502-method-a'),
      is2502KFactor: tracked(3),
      lengthMm: { value: 2000, origin: 'ai-suggestion', confirmedByUser: false },
      widthMm: tracked(1500),
      depthMm: tracked(400),
      bottomMeshXBarDiameterMm: tracked(12),
      bottomMeshXSpacingMm: tracked(150),
      bottomMeshYBarDiameterMm: tracked(12),
      bottomMeshYSpacingMm: tracked(150),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [unconfirmedFooting],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === 'CIVIL_UNCONFIRMED_INPUT')).toBe(true);
    }
  });

  it('rejects IS 2502 Method A if factor k is omitted', () => {
    const missingKFooting = {
      id: 'f1',
      label: 'F1',
      memberType: 'footing',
      count: tracked(1),
      concreteGrade: tracked('M25'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(50),
      cuttingMethod: tracked('is2502-method-a'),
      lengthMm: tracked(2000),
      widthMm: tracked(1500),
      depthMm: tracked(400),
      bottomMeshXBarDiameterMm: tracked(12),
      bottomMeshXSpacingMm: tracked(150),
      bottomMeshYBarDiameterMm: tracked(12),
      bottomMeshYSpacingMm: tracked(150),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [missingKFooting],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === 'CIVIL_MISSING_IS2502_K_FACTOR')).toBe(
        true,
      );
    }
  });

  it('rejects Method A when specified leg length is entered for footing (prevents silent drop)', () => {
    const footingWithLeg: FootingMemberInput = {
      id: 'f1',
      label: 'F1',
      memberType: 'footing',
      count: tracked(1),
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
      bendLegHeightMm: tracked(200),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [footingWithLeg],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) =>
            i.message ===
            'IS 2502 method supports standard end bends only for this shape — use Site Practice method or enter a standard bend',
        ),
      ).toBe(true);
    }
  });

  it('rejects Method A when specified extension is entered for column main bars', () => {
    const colWithExt: ColumnMemberInput = {
      id: 'c1',
      label: 'C1',
      memberType: 'column',
      count: tracked(1),
      concreteGrade: tracked('M30'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(40),
      cuttingMethod: tracked('is2502-method-a'),
      is2502KFactor: tracked(3),
      widthMm: tracked(300),
      depthMm: tracked(400),
      heightMm: tracked(3000),
      mainBarDiameterMm: tracked(16),
      mainBarCount: tracked(4),
      mainBarLapOrEndExtensionMm: tracked(300),
      tieDiameterMm: tracked(8),
      tieSpacingMm: tracked(150),
      tieHookAngle: tracked(135),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [colWithExt],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) =>
            i.message ===
            'IS 2502 method supports standard end bends only for this shape — use Site Practice method or enter a standard bend',
        ),
      ).toBe(true);
    }
  });

  it('rejects Method A when hook length is entered for beam (top or bottom bars)', () => {
    const beamWithHook: BeamMemberInput = {
      id: 'b1',
      label: 'B1',
      memberType: 'beam',
      count: tracked(1),
      concreteGrade: tracked('M25'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(25),
      cuttingMethod: tracked('is2502-method-a'),
      is2502KFactor: tracked(3),
      widthMm: tracked(250),
      depthMm: tracked(450),
      lengthMm: tracked(4000),
      topBarDiameterMm: tracked(12),
      topBarCount: tracked(2),
      topBarEndHookLengthMm: tracked(200),
      bottomBarDiameterMm: tracked(16),
      bottomBarCount: tracked(3),
      stirrupDiameterMm: tracked(8),
      stirrupSpacingMm: tracked(150),
      stirrupHookAngle: tracked(135),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [beamWithHook],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) =>
            i.message ===
            'IS 2502 method supports standard end bends only for this shape — use Site Practice method or enter a standard bend',
        ),
      ).toBe(true);
    }
  });

  it('rejects Method A when leg length is entered for slab (main or dist bars)', () => {
    const slabWithLeg: SlabZoneMemberInput = {
      id: 's1',
      label: 'S1',
      memberType: 'slab',
      count: tracked(1),
      concreteGrade: tracked('M20'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(20),
      cuttingMethod: tracked('is2502-method-a'),
      is2502KFactor: tracked(3),
      lengthMm: tracked(5000),
      widthMm: tracked(3000),
      thicknessMm: tracked(150),
      mainBarDiameterMm: tracked(10),
      mainBarSpacingMm: tracked(150),
      mainBarEndBendLegMm: tracked(100),
      distBarDiameterMm: tracked(8),
      distBarSpacingMm: tracked(200),
    };

    const parsed = constructionPlannerInput.safeParse({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [slabWithLeg],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some(
          (i) =>
            i.message ===
            'IS 2502 method supports standard end bends only for this shape — use Site Practice method or enter a standard bend',
        ),
      ).toBe(true);
    }
  });

  it('aggregates multi-member project summaries by diameter, member type, and concrete grade', () => {
    const footing: FootingMemberInput = {
      id: 'f1',
      label: 'F1',
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
    };

    const column: ColumnMemberInput = {
      id: 'c1',
      label: 'C1',
      memberType: 'column',
      count: tracked(2),
      concreteGrade: tracked('M30'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(40),
      cuttingMethod: tracked('is2502-method-a'),
      is2502KFactor: tracked(3),
      widthMm: tracked(300),
      depthMm: tracked(400),
      heightMm: tracked(3000),
      mainBarDiameterMm: tracked(16),
      mainBarCount: tracked(4),
      tieDiameterMm: tracked(8),
      tieSpacingMm: tracked(150),
      tieHookAngle: tracked(135),
    };

    const res = constructionPlanner.run({
      projectId: 'p-multi',
      projectName: 'Multi Member Project',
      members: [footing, column],
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalConcreteVolumeM3).toBe('3.12');
    const diamSummaries = res.value.summaryByDiameter;
    expect(diamSummaries.map((s) => s.diameterMm)).toEqual(['8', '12', '16']);

    const mTypeSummaries = res.value.summaryByMemberType;
    expect(mTypeSummaries.find((s) => s.memberType === 'footing')?.concreteVolumeM3).toBe('2.4');
    expect(mTypeSummaries.find((s) => s.memberType === 'column')?.concreteVolumeM3).toBe('0.72');

    const gradeSummaries = res.value.summaryByConcreteGrade;
    expect(gradeSummaries.find((s) => s.concreteGrade === 'M25')?.volumeM3).toBe('2.4');
    expect(gradeSummaries.find((s) => s.concreteGrade === 'M30')?.volumeM3).toBe('0.72');
  });

  it('respects user-specified custom seismicHookLengthMm', () => {
    const columnSeismic: ColumnMemberInput = {
      id: 'c-seismic',
      label: 'C-Seismic',
      memberType: 'column',
      count: tracked(1),
      concreteGrade: tracked('M30'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(40),
      cuttingMethod: tracked('site-practice-method-b'),
      widthMm: tracked(300),
      depthMm: tracked(400),
      heightMm: tracked(3000),
      mainBarDiameterMm: tracked(16),
      mainBarCount: tracked(4),
      mainBarLapOrEndExtensionMm: tracked(0),
      tieDiameterMm: tracked(8),
      tieSpacingMm: tracked(150),
      tieHookAngle: tracked(135),
      seismicHookLengthMm: tracked(75),
    };

    const res = constructionPlanner.run({
      projectId: 'p-seismic',
      projectName: 'Seismic Project',
      members: [columnSeismic],
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const tie = getItem(res.value.bbsItems, 'C-Seismic-T1');
    expect(tie.singleBarCuttingLengthMm).toBe('1134');
  });
});
