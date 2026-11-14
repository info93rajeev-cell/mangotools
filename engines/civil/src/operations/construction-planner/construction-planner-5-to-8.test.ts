/**
 * Construction Project Planner - Hand-Worked Verification Examples 5 to 8.
 *
 * Example 5: Beam - Method A (IS 2502:1963 k=3, Table III Ref E, Table VIII Ref A, Cl 5.1.1)
 * Example 6: Beam - Method B (Site practice deductions, user stirrup hook = 75 mm)
 * Example 7: Slab Zone - Method A (IS 2502:1963 k=3, Table III Ref E, Cl 5.1.1)
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
  // Example 5: Beam - Method A (IS 2502:1963 k=3)
  // --------------------------------------------------------------------------
  it('Example 5: Beam - Method A (IS 2502 k=3)', () => {
    // Inputs: W=250, D=450, L=4000, Cover=25, Count=1
    // Top bars: 2 bars, d=12 mm. Bot bars: 3 bars, d=16 mm.
    // Stirrups: d=8 mm, spacing=150 mm.
    // Concrete Volume: V = 0.25 * 0.45 * 4.0 = 0.45 m3
    // Clear length l = 4000 - 2*25 = 3950 mm
    //
    // Top bars (12 mm, IS 2502 Table III Ref E):
    // Table II: B = max(75, roundTo5(5.5*12)) = max(75, 65) = 75 mm
    // L_calc = 3950 + 2*75 = 4100 mm -> Cl 5.1.1 ceil25 = 4100 mm (4.100 m)
    // Weight top = (2 * 4.100) * 0.888 = 7.2816 kg
    //
    // Bottom bars (16 mm, IS 2502 Table III Ref E):
    // Table II: B = max(75, roundTo5(5.5*16)) = max(75, 90) = 90 mm
    // L_calc = 3950 + 2*90 = 4130 mm -> Cl 5.1.1 ceil25 = 4150 mm (4.150 m)
    // Weight bot = (3 * 4.150) * 1.58 = 19.671 kg
    //
    // Stirrups (8 mm, IS 2502 Table VIII Ref A):
    // Count = ceil(3950 / 150) + 1 = 28 stirrups
    // Inside: E = 250 - 50 - 16 = 184 mm, A = 450 - 50 - 16 = 384 mm
    // L_calc = 2*(384 + 184) + 24*8 = 1136 + 192 = 1328 mm -> Cl 5.1.1 ceil25 = 1350 mm
    // Weight stirrups = (28 * 1.350) * 0.395 = 14.931 kg
    // Total weight = 7.2816 + 19.671 + 14.931 = 41.8836 kg

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
    expect(topItem.calculatedCuttingLengthMm).toBe('4100');
    expect(topItem.singleBarCuttingLengthMm).toBe('4100');
    expect(topItem.totalWeightKg).toBe('7.2816');

    const botItem = getItem(res.value.bbsItems, 'B1-B1');
    expect(botItem.calculatedCuttingLengthMm).toBe('4130');
    expect(botItem.singleBarCuttingLengthMm).toBe('4150');
    expect(botItem.totalWeightKg).toBe('19.671');

    const stItem = getItem(res.value.bbsItems, 'B1-S1');
    expect(stItem.barsPerMember).toBe('28');
    expect(stItem.calculatedCuttingLengthMm).toBe('1328');
    expect(stItem.singleBarCuttingLengthMm).toBe('1350');
    expect(stItem.totalWeightKg).toBe('14.931');

    expect(res.value.totalRebarWeightKg).toBe('41.8836');
  });

  // --------------------------------------------------------------------------
  // Example 6: Beam - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 6: Beam - Method B (Site practice deductions)', () => {
    // Top bars: 3950 + 400 - 2*(2*12) = 4302 mm -> W = 2 * 4.302 * 0.888 = 7.640352 kg
    // Bot bars: 3950 + 400 - 2*(2*16) = 4286 mm -> W = 3 * 4.286 * 1.58 = 20.31564 kg
    // Stirrups: Count = ceil(3950/150) + 1 = 28. Perimeter = 2*(200+400) = 1200 mm
    // User hook = 75 mm -> 2*75 = 150 mm. Deductions = 12d = 96 mm
    // L = 1200 + 150 - 96 = 1254 mm (1.254 m)
    // Weight stirrups = (28 * 1.254) * 0.395 = 13.86924 kg
    // Total weight = 7.640352 + 20.31564 + 13.86924 = 41.825232 kg

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
      methodBStirrupHookMm: tracked(75),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [beam],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const topItem = getItem(res.value.bbsItems, 'B1-T1');
    expect(topItem.calculatedCuttingLengthMm).toBe('4302');
    expect(topItem.singleBarCuttingLengthMm).toBe('4302');
    expect(topItem.totalWeightKg).toBe('7.640352');

    const botItem = getItem(res.value.bbsItems, 'B1-B1');
    expect(botItem.calculatedCuttingLengthMm).toBe('4286');
    expect(botItem.singleBarCuttingLengthMm).toBe('4286');
    expect(botItem.totalWeightKg).toBe('20.31564');

    const stItem = getItem(res.value.bbsItems, 'B1-S1');
    expect(stItem.barsPerMember).toBe('28');
    expect(stItem.calculatedCuttingLengthMm).toBe('1254');
    expect(stItem.singleBarCuttingLengthMm).toBe('1254');
    expect(stItem.totalWeightKg).toBe('13.86924');

    expect(res.value.totalRebarWeightKg).toBe('41.825232');
  });

  // --------------------------------------------------------------------------
  // Example 7: Slab Zone - Method A (IS 2502 k=3)
  // --------------------------------------------------------------------------
  it('Example 7: Slab Zone - Method A (IS 2502 k=3)', () => {
    // Inputs: L=5000, W=3000, T=150, Cover=20, Count=1
    // Main bars (10 mm, short span across W):
    // Count = ceil((5000 - 40) / 150) + 1 = ceil(4960 / 150) + 1 = 35 bars
    // Base width = 3000 - 40 = 2960 mm
    // Table II: B = max(75, roundTo5(5.5*10)) = 75 mm
    // Table III Ref E: L_calc = 2960 + 2*75 = 3110 mm -> Cl 5.1.1 ceil25 = 3125 mm (3.125 m)
    // Weight main = (35 * 3.125) * 0.617 = 67.484375 kg
    //
    // Distribution bars (8 mm, long span across L):
    // Count = ceil((3000 - 40) / 200) + 1 = ceil(2960 / 200) + 1 = 16 bars
    // Base length = 5000 - 40 = 4960 mm
    // Table II: B = max(75, roundTo5(5.5*8)) = 75 mm
    // Table III Ref E: L_calc = 4960 + 2*75 = 5110 mm -> Cl 5.1.1 ceil25 = 5125 mm (5.125 m)
    // Weight dist = (16 * 5.125) * 0.395 = 32.39 kg
    // Total weight = 67.484375 + 32.39 = 99.874375 kg

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
    expect(mainItem.barsPerMember).toBe('35');
    expect(mainItem.calculatedCuttingLengthMm).toBe('3110');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3125');
    expect(mainItem.totalWeightKg).toBe('67.484375');

    const distItem = getItem(res.value.bbsItems, 'S1-D1');
    expect(distItem.barsPerMember).toBe('16');
    expect(distItem.calculatedCuttingLengthMm).toBe('5110');
    expect(distItem.singleBarCuttingLengthMm).toBe('5125');
    expect(distItem.totalWeightKg).toBe('32.39');

    expect(res.value.totalRebarWeightKg).toBe('99.874375');
  });

  // --------------------------------------------------------------------------
  // Example 8: Slab Zone - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 8: Slab Zone - Method B (Site practice deductions)', () => {
    // Main bars: 35 bars. Cut main = 2960 + 200 - 2*(2*10) = 3120 mm = 3.120 m
    // Weight main = (35 * 3.120) * 0.617 = 67.3764 kg
    // Dist bars: 16 bars. Cut dist = 4960 + 200 - 2*(2*8) = 5128 mm = 5.128 m
    // Weight dist = (16 * 5.128) * 0.395 = 32.40896 kg
    // Total weight = 67.3764 + 32.40896 = 99.78536 kg

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
    expect(mainItem.calculatedCuttingLengthMm).toBe('3120');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3120');
    expect(mainItem.totalWeightKg).toBe('67.3764');

    const distItem = getItem(res.value.bbsItems, 'S1-D1');
    expect(distItem.calculatedCuttingLengthMm).toBe('5128');
    expect(distItem.singleBarCuttingLengthMm).toBe('5128');
    expect(distItem.totalWeightKg).toBe('32.40896');

    expect(res.value.totalRebarWeightKg).toBe('99.78536');
  });
});
