/**
 * Construction Project Planner - Hand-Worked Verification Examples 1 to 4.
 *
 * Example 1: Footing - Method A (IS 2502:1963 Table III Ref E, Table II, Cl. 5.1.1)
 * Example 2: Footing - Method B (Site practice deductions)
 * Example 3: Column - Method A (IS 2502:1963 Table III Ref D, Table VIII Ref A, Cl. 5.1.1)
 * Example 4: Column - Method B (Site practice deductions)
 */
import { describe, expect, it } from 'vitest';
import { constructionPlanner } from './operation.ts';
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

describe('Construction Planner - Hand-Worked Examples 1 to 4 (Footing & Column)', () => {
  // --------------------------------------------------------------------------
  // Example 1: Footing - Method A (IS 2502:1963 Table III Ref E, Table II, Cl. 5.1.1)
  // --------------------------------------------------------------------------
  it('Example 1: Footing - Method A (IS 2502 k=3)', () => {
    // Inputs:
    // L=2000 mm, W=1500 mm, D=400 mm, Cover=50 mm, Count=1
    // Mesh X: d=12 mm, spacing=150 mm
    // Mesh Y: d=12 mm, spacing=150 mm
    //
    // Concrete Volume: V = 2.0 * 1.5 * 0.4 = 1.200 m3
    //
    // Mesh X (Table III Ref E: L = l + 2B):
    // Spacing distance = 1500 - 2*50 = 1400 mm
    // Count X = ceil(1400 / 150) + 1 = 10 + 1 = 11 bars (spacing is maximum)
    // Straight length l = 2000 - 2*50 = 1900 mm
    // Table II bend allowance B (k=3, d=12 mm):
    // B = 5.5 * 12 = 66 mm -> nearest 5 mm = 65, min 75 mm => B = 75 mm
    // Calculated cut X = 1900 + 2*75 = 2050 mm
    // Cl. 5.1.1 rounding to next greater 25 mm = 2050 mm = 2.050 m
    // Total length X = 11 * 2.050 = 22.550 m
    // Unit weight (12 mm) = 0.888 kg/m
    // Total weight X = 22.550 * 0.888 = 20.0244 kg
    //
    // Mesh Y (Table III Ref E: L = l + 2B):
    // Spacing distance = 2000 - 2*50 = 1900 mm
    // Count Y = ceil(1900 / 150) + 1 = 13 + 1 = 14 bars
    // Straight length l = 1500 - 2*50 = 1400 mm
    // Table II bend allowance B = 75 mm
    // Calculated cut Y = 1400 + 2*75 = 1550 mm -> rounded = 1550 mm = 1.550 m
    // Total length Y = 14 * 1.550 = 21.700 m
    // Total weight Y = 21.700 * 0.888 = 19.2696 kg
    //
    // Total Footing Rebar = 20.0244 + 19.2696 = 39.294 kg = 0.039294 tonnes

    const footing: FootingMemberInput = {
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

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [footing],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalConcreteVolumeM3).toBe('1.2');
    const xItem = getItem(res.value.bbsItems, 'F1-B1-X');
    expect(xItem.barsPerMember).toBe('11');
    expect(xItem.calculatedCuttingLengthMm).toBe('2050');
    expect(xItem.singleBarCuttingLengthMm).toBe('2050');
    expect(xItem.singleBarCuttingLengthM).toBe('2.05');
    expect(xItem.totalLengthM).toBe('22.55');
    expect(xItem.totalWeightKg).toBe('20.0244');
    expect(xItem.cuttingMethodLabel).toBe('Method: IS 2502 (k=3)');

    const yItem = getItem(res.value.bbsItems, 'F1-B2-Y');
    expect(yItem.barsPerMember).toBe('14');
    expect(yItem.calculatedCuttingLengthMm).toBe('1550');
    expect(yItem.singleBarCuttingLengthMm).toBe('1550');
    expect(yItem.singleBarCuttingLengthM).toBe('1.55');
    expect(yItem.totalLengthM).toBe('21.7');
    expect(yItem.totalWeightKg).toBe('19.2696');

    expect(res.value.totalRebarWeightKg).toBe('39.294');
  });

  // --------------------------------------------------------------------------
  // Example 2: Footing - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 2: Footing - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 1, cuttingMethod = site-practice-method-b, leg = 200 mm
    //
    // Deductions for two 90° bends = 2 * (2*d) = 4 * 12 = 48 mm
    // Cut X = 1900 + 2*200 - 48 = 2252 mm = 2.252 m
    // Count X = 11 bars => Total length = 11 * 2.252 = 24.772 m
    // Total weight X = 24.772 * 0.888 = 21.997536 kg
    //
    // Cut Y = 1400 + 2*200 - 48 = 1752 mm = 1.752 m
    // Count Y = 14 bars => Total length = 14 * 1.752 = 24.528 m
    // Total weight Y = 24.528 * 0.888 = 21.780864 kg
    //
    // Total weight = 21.997536 + 21.780864 = 43.7784 kg

    const footing: FootingMemberInput = {
      id: 'f1',
      label: 'F1',
      memberType: 'footing',
      count: tracked(1),
      concreteGrade: tracked('M25'),
      steelGrade: tracked('Fe500'),
      clearCoverMm: tracked(50),
      cuttingMethod: tracked('site-practice-method-b'),
      lengthMm: tracked(2000),
      widthMm: tracked(1500),
      depthMm: tracked(400),
      bottomMeshXBarDiameterMm: tracked(12),
      bottomMeshXSpacingMm: tracked(150),
      bottomMeshYBarDiameterMm: tracked(12),
      bottomMeshYSpacingMm: tracked(150),
      bendLegHeightMm: tracked(200),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [footing],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const xItem = getItem(res.value.bbsItems, 'F1-B1-X');
    expect(xItem.barsPerMember).toBe('11');
    expect(xItem.singleBarCuttingLengthMm).toBe('2252');
    expect(xItem.totalLengthM).toBe('24.772');
    expect(xItem.totalWeightKg).toBe('21.997536');
    expect(xItem.cuttingMethodLabel).toBe('Method: Site Practice Deductions');

    const yItem = getItem(res.value.bbsItems, 'F1-B2-Y');
    expect(yItem.barsPerMember).toBe('14');
    expect(yItem.singleBarCuttingLengthMm).toBe('1752');
    expect(yItem.totalLengthM).toBe('24.528');
    expect(yItem.totalWeightKg).toBe('21.780864');

    expect(res.value.totalRebarWeightKg).toBe('43.7784');
  });

  // --------------------------------------------------------------------------
  // Example 3: Column - Method A (IS 2502 Table III Ref D, Table VIII Ref A, Cl. 5.1.1)
  // --------------------------------------------------------------------------
  it('Example 3: Column - Method A (IS 2502 k=3)', () => {
    // Inputs: W=300, D=400, H=3000, Cover=40, Count=1
    // Main bars: 4 bars, d=16 mm
    // Ties: d=8 mm, spacing=150 mm
    //
    // Concrete Volume: V = 0.3 * 0.4 * 3.0 = 0.360 m3
    //
    // Main bars (Table III Ref D: L = l + B):
    // Straight l = 3000 mm
    // Table II bend allowance B (k=3, d=16 mm) = 5.5 * 16 = 88 -> nearest 5 mm = 90 mm
    // Calculated cut = 3000 + 90 = 3090 mm
    // Cl. 5.1.1 rounding to next 25 mm = ceil(3090/25)*25 = 3100 mm = 3.100 m
    // Total length = 4 * 3.100 = 12.400 m
    // Total weight main = 12.400 * 1.58 = 19.592 kg
    //
    // Lateral ties (Table VIII Ref A: L = 2(A+E) + 24d):
    // Tie count = ceil(3000 / 150) + 1 = 20 + 1 = 21 ties
    // Inside dimensions:
    // E = 300 - 2*40 - 2*8 = 204 mm
    // A = 400 - 2*40 - 2*8 = 304 mm
    // 2(A+E) = 2*(304 + 204) = 1016 mm
    // 24d = 24 * 8 = 192 mm
    // Calculated cut tie = 1016 + 192 = 1208 mm
    // Cl. 5.1.1 rounding to next 25 mm = ceil(1208/25)*25 = 1225 mm = 1.225 m
    // Total length = 21 * 1.225 = 25.725 m
    // Total weight ties = 25.725 * 0.395 = 10.161375 kg
    //
    // Total Column Rebar = 19.592 + 10.161375 = 29.753375 kg

    const column: ColumnMemberInput = {
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

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [column],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.value.totalConcreteVolumeM3).toBe('0.36');
    const mainItem = getItem(res.value.bbsItems, 'C1-M1');
    expect(mainItem.calculatedCuttingLengthMm).toBe('3090');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3100');
    expect(mainItem.singleBarCuttingLengthM).toBe('3.1');
    expect(mainItem.totalLengthM).toBe('12.4');
    expect(mainItem.totalWeightKg).toBe('19.592');

    const tieItem = getItem(res.value.bbsItems, 'C1-T1');
    expect(tieItem.barsPerMember).toBe('21');
    expect(tieItem.calculatedCuttingLengthMm).toBe('1208');
    expect(tieItem.singleBarCuttingLengthMm).toBe('1225');
    expect(tieItem.singleBarCuttingLengthM).toBe('1.225');
    expect(tieItem.totalLengthM).toBe('25.725');
    expect(tieItem.totalWeightKg).toBe('10.161375');

    expect(res.value.totalRebarWeightKg).toBe('29.753375');
  });

  // --------------------------------------------------------------------------
  // Example 4: Column - Method B (Site Practice Deductions, User Input Hook)
  // --------------------------------------------------------------------------
  it('Example 4: Column - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 3, cuttingMethod = site-practice-method-b,
    // extension = 300 mm, methodBStirrupHookMm = 75 mm
    //
    // Main bars: 1 90° bend deduction = 2*d = 32 mm
    // Cut main = 3000 + 300 - 32 = 3268 mm = 3.268 m
    // Weight main = (4 * 3.268) * 1.58 = 13.072 * 1.58 = 20.65376 kg
    //
    // Lateral ties:
    // Core perimeter = 2*(220 + 320) = 1080 mm
    // User-entered hooks = 2 * 75 = 150 mm
    // Deductions = 12d = 96 mm
    // Tie cut = 1080 + 150 - 96 = 1134 mm = 1.134 m
    // Weight ties = (21 * 1.134) * 0.395 = 23.814 * 0.395 = 9.40653 kg
    //
    // Total weight = 20.65376 + 9.40653 = 30.06029 kg

    const column: ColumnMemberInput = {
      id: 'c1',
      label: 'C1',
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
      mainBarLapOrEndExtensionMm: tracked(300),
      tieDiameterMm: tracked(8),
      tieSpacingMm: tracked(150),
      tieHookAngle: tracked(135),
      methodBStirrupHookMm: tracked(75),
    };

    const res = constructionPlanner.run({
      projectId: 'p1',
      projectName: 'Test Project',
      members: [column],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const mainItem = getItem(res.value.bbsItems, 'C1-M1');
    expect(mainItem.singleBarCuttingLengthMm).toBe('3268');
    expect(mainItem.totalWeightKg).toBe('20.65376');

    const tieItem = getItem(res.value.bbsItems, 'C1-T1');
    expect(tieItem.singleBarCuttingLengthMm).toBe('1134');
    expect(tieItem.totalWeightKg).toBe('9.40653');

    expect(res.value.totalRebarWeightKg).toBe('30.06029');
  });
});
