/**
 * Construction Project Planner - Validation, Provenance & Multi-Member Aggregation Tests.
 */
import { describe, expect, it } from 'vitest';
import { constructionPlanner } from './operation.ts';
import { constructionPlannerInput } from './schema.ts';
import type {
  CalculatedBarScheduleItem,
  ColumnMemberInput,
  FootingMemberInput,
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
      // Unconfirmed dimension (e.g. raw AI or PDF suggestion unverified by user)
      lengthMm: { value: 2000, origin: 'ai-suggestion', confirmedByUser: false },
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
      members: [unconfirmedFooting],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      expect(issues.some((i) => i.message === 'CIVIL_UNCONFIRMED_INPUT')).toBe(true);
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
      // is2502KFactor omitted
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
      members: [missingKFooting],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      expect(issues.some((i) => i.message === 'CIVIL_MISSING_IS2502_K_FACTOR')).toBe(true);
    }
  });

  it('aggregates multi-member project summaries by diameter, member type, and concrete grade', () => {
    const footing: FootingMemberInput = {
      id: 'f1',
      label: 'F1',
      memberType: 'footing',
      count: tracked(2), // 2 footings
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

    const column: ColumnMemberInput = {
      id: 'c1',
      label: 'C1',
      memberType: 'column',
      count: tracked(2), // 2 columns
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

    const res = constructionPlanner.run({
      projectId: 'p-multi',
      projectName: 'Multi Member Project',
      members: [footing, column],
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Footing volume per member = 1.2 m3 * 2 = 2.4 m3
    // Column volume per member = 0.36 m3 * 2 = 0.72 m3
    // Total concrete volume = 2.4 + 0.72 = 3.12 m3
    expect(res.value.totalConcreteVolumeM3).toBe('3.12');

    // Summaries by diameter should include 8, 12, 16 mm sorted ascending
    const diamSummaries = res.value.summaryByDiameter;
    expect(diamSummaries.map((s) => s.diameterMm)).toEqual(['8', '12', '16']);

    // Member type summaries: footing and column
    const mTypeSummaries = res.value.summaryByMemberType;
    expect(mTypeSummaries.find((s) => s.memberType === 'footing')?.concreteVolumeM3).toBe('2.4');
    expect(mTypeSummaries.find((s) => s.memberType === 'column')?.concreteVolumeM3).toBe('0.72');

    // Concrete grade summaries: M25 and M30
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
      seismicHookLengthMm: tracked(75), // Explicit custom seismic hook length
    };

    const res = constructionPlanner.run({
      projectId: 'p-seismic',
      projectName: 'Seismic Project',
      members: [columnSeismic],
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const tie = getItem(res.value.bbsItems, 'C-Seismic-T1');
    // Core perimeter = 2*(220 + 320) = 1080 mm
    // Hooks = 2 * 75 = 150 mm
    // Deductions = 12 * 8 = 96 mm
    // Tie cutting length = 1080 + 150 - 96 = 1134 mm
    expect(tie.singleBarCuttingLengthMm).toBe('1134');
  });
});
