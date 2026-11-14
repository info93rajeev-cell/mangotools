/**
 * Construction Project Planner - Hand-Worked Verification Examples 5 to 8.
 *
 * Example 5: Beam - Method A (IS 2502:1963 k=3)
 * Example 6: Beam - Method B (Site practice deductions)
 * Example 7: Slab Zone - Method A (IS 2502:1963 k=3)
 * Example 8: Slab Zone - Method B (Site practice deductions)
 */
import { describe, expect, it } from 'vitest';
import { constructionPlanner } from './operation.ts';
import type {
  BeamMemberInput,
  CalculatedBarScheduleItem,
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

describe('Construction Planner - Hand-Worked Examples 5 to 8 (Beam & Slab)', () => {
  // --------------------------------------------------------------------------
  // Example 5: Beam - Method A (IS 2502 k=3)
  // --------------------------------------------------------------------------
  it('Example 5: Beam - Method A (IS 2502 k=3)', () => {
    // Inputs: W=250, D=450, L=4000, Cover=25, Count=1
    // Top bars: 2 bars, d=12 mm, hook=200 mm
    // Bottom bars: 3 bars, d=16 mm, hook=200 mm
    // Stirrups: d=8 mm, spacing=150 mm, 135° hook
    //
    // Concrete Volume: V = 0.25 * 0.45 * 4.0 = 0.45 m3
    // Clear span = 4000 - 2*25 = 3950 mm
    //
    // Top bars (12 mm):
    // 90° bend allowance B = ceilTo5(4 * (pi/4) * 12) = 40 mm
    // Cut top = 3950 + 2*200 + 2*40 = 4430 mm = 4.430 m
    // Weight top = (2 * 4.430) * 0.888 = 8.860 * 0.888 = 7.86768 kg
    //
    // Bottom bars (16 mm):
    // 90° bend allowance B = ceilTo5(4 * (pi/4) * 16) = 55 mm
    // Cut bot = 3950 + 2*200 + 2*55 = 4460 mm = 4.460 m
    // Weight bot = (3 * 4.460) * 1.58 = 13.380 * 1.58 = 21.1404 kg
    //
    // Stirrups (8 mm):
    // Count = floor(3950 / 150) + 1 = 27 stirrups
    // Core: a = 250 - 2*25 = 200 mm, b = 450 - 2*25 = 400 mm
    // Hook allowance = ceilTo5(6 * 8) = 50 mm
    // Cut stirrup = 2*(200 + 400) + 2*50 = 1300 mm = 1.300 m
    // Weight stirrups = (27 * 1.300) * 0.395 = 35.100 * 0.395 = 13.8645 kg
    //
    // Total weight = 7.86768 + 21.1404 + 13.8645 = 42.87258 kg

    const beam: BeamMemberInput = {
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
      bottomBarEndHookLengthMm: tracked(200),
      stirrupDiameterMm: tracked(8),
      stirrupSpacingMm: tracked(150),
      stirrupHookAngle: tracked(135),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [beam],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalConcreteVolumeM3).toBe('0.45');
    const topItem = getItem(res.value.bbsItems, 'B1-T1');
    expect(topItem.singleBarCuttingLengthMm).toBe('4430');
    expect(topItem.totalWeightKg).toBe('7.86768');

    const botItem = getItem(res.value.bbsItems, 'B1-B1');
    expect(botItem.singleBarCuttingLengthMm).toBe('4460');
    expect(botItem.totalWeightKg).toBe('21.1404');

    const stItem = getItem(res.value.bbsItems, 'B1-S1');
    expect(stItem.barsPerMember).toBe('27');
    expect(stItem.singleBarCuttingLengthMm).toBe('1300');
    expect(stItem.totalWeightKg).toBe('13.8645');

    expect(res.value.totalRebarWeightKg).toBe('42.87258');
  });

  // --------------------------------------------------------------------------
  // Example 6: Beam - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 6: Beam - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 5, cuttingMethod = site-practice-method-b
    //
    // Top bars: 2 90° bends deduction = 2*(2*12) = 48 mm
    // Cut top = 3950 + 400 - 48 = 4302 mm = 4.302 m
    // Weight top = (2 * 4.302) * 0.888 = 8.604 * 0.888 = 7.640352 kg
    //
    // Bottom bars: 2 90° bends deduction = 2*(2*16) = 64 mm
    // Cut bot = 3950 + 400 - 64 = 4286 mm = 4.286 m
    // Weight bot = (3 * 4.286) * 1.58 = 12.858 * 1.58 = 20.31564 kg
    //
    // Shear stirrups: Perimeter = 2*(200 + 400) = 1200 mm
    // Hooks = 2 * (6*8) = 96 mm, Deductions = 12d = 96 mm
    // Cut stirrup = 1200 + 96 - 96 = 1200 mm = 1.200 m
    // Weight stirrups = (27 * 1.200) * 0.395 = 32.400 * 0.395 = 12.798 kg
    //
    // Total weight = 7.640352 + 20.31564 + 12.798 = 40.753992 kg

    const beam: BeamMemberInput = {
      id: 'b1',
      label: 'B1',
      memberType: 'beam',
      count: tracked(1),
      concreteGrade: tracked('M25'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(25),
      cuttingMethod: tracked('site-practice-method-b'),
      widthMm: tracked(250),
      depthMm: tracked(450),
      lengthMm: tracked(4000),
      topBarDiameterMm: tracked(12),
      topBarCount: tracked(2),
      topBarEndHookLengthMm: tracked(200),
      bottomBarDiameterMm: tracked(16),
      bottomBarCount: tracked(3),
      bottomBarEndHookLengthMm: tracked(200),
      stirrupDiameterMm: tracked(8),
      stirrupSpacingMm: tracked(150),
      stirrupHookAngle: tracked(135),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [beam],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const topItem = getItem(res.value.bbsItems, 'B1-T1');
    expect(topItem.singleBarCuttingLengthMm).toBe('4302');
    expect(topItem.totalWeightKg).toBe('7.640352');

    const botItem = getItem(res.value.bbsItems, 'B1-B1');
    expect(botItem.singleBarCuttingLengthMm).toBe('4286');
    expect(botItem.totalWeightKg).toBe('20.31564');

    const stItem = getItem(res.value.bbsItems, 'B1-S1');
    expect(stItem.singleBarCuttingLengthMm).toBe('1200');
    expect(stItem.totalWeightKg).toBe('12.798');

    expect(res.value.totalRebarWeightKg).toBe('40.753992');
  });

  // --------------------------------------------------------------------------
  // Example 7: Slab Zone - Method A (IS 2502 k=3)
  // --------------------------------------------------------------------------
  it('Example 7: Slab Zone - Method A (IS 2502 k=3)', () => {
    // Inputs: L=5000, W=3000, T=150, Cover=20, Count=1
    // Main bars: d=10 mm, spacing=150 mm, leg=100 mm
    // Dist bars: d=8 mm, spacing=200 mm, leg=100 mm
    //
    // Concrete Volume: V = 5.0 * 3.0 * 0.15 = 2.25 m3
    // Main bars (10 mm, short span across W):
    // Count = floor((5000 - 2*20) / 150) + 1 = floor(4960 / 150) + 1 = 34 bars
    // Base width = 3000 - 2*20 = 2960 mm
    // 90° bend allowance B = ceilTo5(4 * (pi/4) * 10) = 35 mm
    // Cut main = 2960 + 2*100 + 2*35 = 3230 mm = 3.230 m
    // Weight main = (34 * 3.230) * 0.617 = 109.820 * 0.617 = 67.75894 kg
    //
    // Distribution bars (8 mm, long span across L):
    // Count = floor((3000 - 2*20) / 200) + 1 = floor(2960 / 200) + 1 = 15 bars
    // Base length = 5000 - 2*20 = 4960 mm
    // 90° bend allowance B = ceilTo5(4 * (pi/4) * 8) = 30 mm
    // Cut dist = 4960 + 2*100 + 2*30 = 5220 mm = 5.220 m
    // Weight dist = (15 * 5.220) * 0.395 = 78.300 * 0.395 = 30.9285 kg
    //
    // Total weight = 67.75894 + 30.9285 = 98.68744 kg

    const slab: SlabZoneMemberInput = {
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
      distBarEndBendLegMm: tracked(100),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [slab],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalConcreteVolumeM3).toBe('2.25');
    const mainItem = getItem(res.value.bbsItems, 'S1-M1');
    expect(mainItem.barsPerMember).toBe('34');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3230');
    expect(mainItem.totalWeightKg).toBe('67.75894');

    const distItem = getItem(res.value.bbsItems, 'S1-D1');
    expect(distItem.barsPerMember).toBe('15');
    expect(distItem.singleBarCuttingLengthMm).toBe('5220');
    expect(distItem.totalWeightKg).toBe('30.9285');

    expect(res.value.totalRebarWeightKg).toBe('98.68744');
  });

  // --------------------------------------------------------------------------
  // Example 8: Slab Zone - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 8: Slab Zone - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 7, cuttingMethod = site-practice-method-b
    //
    // Main bars: 2 90° bends deduction = 2*(2*10) = 40 mm
    // Cut main = 2960 + 200 - 40 = 3120 mm = 3.120 m
    // Weight main = (34 * 3.120) * 0.617 = 106.080 * 0.617 = 65.45136 kg
    //
    // Distribution bars: 2 90° bends deduction = 2*(2*8) = 32 mm
    // Cut dist = 4960 + 200 - 32 = 5128 mm = 5.128 m
    // Weight dist = (15 * 5.128) * 0.395 = 76.920 * 0.395 = 30.3834 kg
    //
    // Total weight = 65.45136 + 30.3834 = 95.83476 kg

    const slab: SlabZoneMemberInput = {
      id: 's1',
      label: 'S1',
      memberType: 'slab',
      count: tracked(1),
      concreteGrade: tracked('M20'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(20),
      cuttingMethod: tracked('site-practice-method-b'),
      lengthMm: tracked(5000),
      widthMm: tracked(3000),
      thicknessMm: tracked(150),
      mainBarDiameterMm: tracked(10),
      mainBarSpacingMm: tracked(150),
      mainBarEndBendLegMm: tracked(100),
      distBarDiameterMm: tracked(8),
      distBarSpacingMm: tracked(200),
      distBarEndBendLegMm: tracked(100),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [slab],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const mainItem = getItem(res.value.bbsItems, 'S1-M1');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3120');
    expect(mainItem.totalWeightKg).toBe('65.45136');

    const distItem = getItem(res.value.bbsItems, 'S1-D1');
    expect(distItem.singleBarCuttingLengthMm).toBe('5128');
    expect(distItem.totalWeightKg).toBe('30.3834');

    expect(res.value.totalRebarWeightKg).toBe('95.83476');
  });
});
