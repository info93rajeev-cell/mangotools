/**
 * Construction Project Planner - Hand-Worked Verification Examples 1 to 4.
 *
 * Example 1: Footing - Method A (IS 2502:1963 k=3)
 * Example 2: Footing - Method B (Site practice deductions)
 * Example 3: Column - Method A (IS 2502:1963 k=3)
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
  // Example 1: Footing - Method A (IS 2502:1963 k=3)
  // --------------------------------------------------------------------------
  it('Example 1: Footing - Method A (IS 2502 k=3)', () => {
    // Inputs:
    // L=2000 mm, W=1500 mm, D=400 mm, Cover=50 mm, Count=1
    // Mesh X: d=12 mm, spacing=150 mm, leg=200 mm
    // Mesh Y: d=12 mm, spacing=150 mm, leg=200 mm
    //
    // Arithmetic Step 1 - Concrete Volume:
    // V = (2000/1000) * (1500/1000) * (400/1000) = 2.0 * 1.5 * 0.4 = 1.2 m3
    //
    // Arithmetic Step 2 - Bottom Mesh X (length direction):
    // Spacing width = 1500 - 2*50 = 1400 mm
    // Count X = floor(1400 / 150) + 1 = 9 + 1 = 10 bars
    // Base X = 2000 - 2*50 = 1900 mm
    // IS 2502 90° bend allowance B (k=3, d=12):
    // B_raw = 4 * (pi / 4) * 12 = 37.699 mm -> ceilTo5 = 40 mm
    // Cut X = 1900 + 2*200 + 2*40 = 2380 mm = 2.380 m
    // Total length X = 10 * 2.380 = 23.800 m
    // Unit weight (12 mm per IS 1786) = 0.888 kg/m
    // Total weight X = 23.800 * 0.888 = 21.1344 kg
    //
    // Arithmetic Step 3 - Bottom Mesh Y (width direction):
    // Spacing length = 2000 - 2*50 = 1900 mm
    // Count Y = floor(1900 / 150) + 1 = 12 + 1 = 13 bars
    // Base Y = 1500 - 2*50 = 1400 mm
    // Cut Y = 1400 + 2*200 + 2*40 = 1880 mm = 1.880 m
    // Total length Y = 13 * 1.880 = 24.440 m
    // Total weight Y = 24.440 * 0.888 = 21.70272 kg
    //
    // Arithmetic Step 4 - Total Rebar:
    // Total weight = 21.1344 + 21.70272 = 42.83712 kg = 0.042837 tonnes

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
    expect(xItem.barsPerMember).toBe('10');
    expect(xItem.singleBarCuttingLengthMm).toBe('2380');
    expect(xItem.singleBarCuttingLengthM).toBe('2.38');
    expect(xItem.totalLengthM).toBe('23.8');
    expect(xItem.totalWeightKg).toBe('21.1344');
    expect(xItem.cuttingMethodLabel).toBe('Method: IS 2502 (k=3)');

    const yItem = getItem(res.value.bbsItems, 'F1-B2-Y');
    expect(yItem.barsPerMember).toBe('13');
    expect(yItem.singleBarCuttingLengthMm).toBe('1880');
    expect(yItem.singleBarCuttingLengthM).toBe('1.88');
    expect(yItem.totalLengthM).toBe('24.44');
    expect(yItem.totalWeightKg).toBe('21.70272');

    expect(res.value.totalRebarWeightKg).toBe('42.83712');
  });

  // --------------------------------------------------------------------------
  // Example 2: Footing - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 2: Footing - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 1, cuttingMethod = site-practice-method-b
    //
    // Deductions for two 90° bends = 2 * (2*d) = 4 * 12 = 48 mm
    // Cut X = 1900 + 2*200 - 48 = 2252 mm = 2.252 m
    // Total weight X = (10 * 2.252) * 0.888 = 22.520 * 0.888 = 19.99776 kg
    //
    // Cut Y = 1400 + 2*200 - 48 = 1752 mm = 1.752 m
    // Total weight Y = (13 * 1.752) * 0.888 = 22.776 * 0.888 = 20.225088 kg
    //
    // Total weight = 19.99776 + 20.225088 = 40.222848 kg

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
    expect(xItem.singleBarCuttingLengthMm).toBe('2252');
    expect(xItem.totalLengthM).toBe('22.52');
    expect(xItem.totalWeightKg).toBe('19.99776');
    expect(xItem.cuttingMethodLabel).toBe('Method: Site Practice Deductions');

    const yItem = getItem(res.value.bbsItems, 'F1-B2-Y');
    expect(yItem.singleBarCuttingLengthMm).toBe('1752');
    expect(yItem.totalLengthM).toBe('22.776');
    expect(yItem.totalWeightKg).toBe('20.225088');

    expect(res.value.totalRebarWeightKg).toBe('40.222848');
  });

  // --------------------------------------------------------------------------
  // Example 3: Column - Method A (IS 2502 k=3)
  // --------------------------------------------------------------------------
  it('Example 3: Column - Method A (IS 2502 k=3)', () => {
    // Inputs: W=300, D=400, H=3000, Cover=40, Count=1
    // Main bars: 4 bars, d=16 mm, extension=300 mm
    // Ties: d=8 mm, spacing=150 mm, 135° hook
    //
    // Concrete Volume: V = 0.3 * 0.4 * 3.0 = 0.36 m3
    // Main bars (16 mm):
    // 90° bend allowance B (k=3, d=16) = ceilTo5(4 * (pi/4) * 16) = 55 mm
    // Cut main = 3000 + 300 + 55 = 3355 mm = 3.355 m
    // Total weight main = (4 * 3.355) * 1.58 = 13.420 * 1.58 = 21.2036 kg
    //
    // Lateral ties (8 mm):
    // Count = floor(3000 / 150) + 1 = 21 ties
    // Core: a = 300 - 2*40 = 220 mm, b = 400 - 2*40 = 320 mm
    // Hook 135° = ceilTo5(6 * 8) = ceilTo5(48) = 50 mm
    // Tie cut = 2*(220 + 320) + 2*50 = 1080 + 100 = 1180 mm = 1.180 m
    // Total weight ties = (21 * 1.180) * 0.395 = 24.780 * 0.395 = 9.7881 kg
    //
    // Total weight = 21.2036 + 9.7881 = 30.9917 kg

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
    expect(mainItem.singleBarCuttingLengthMm).toBe('3355');
    expect(mainItem.totalLengthM).toBe('13.42');
    expect(mainItem.totalWeightKg).toBe('21.2036');

    const tieItem = getItem(res.value.bbsItems, 'C1-T1');
    expect(tieItem.barsPerMember).toBe('21');
    expect(tieItem.singleBarCuttingLengthMm).toBe('1180');
    expect(tieItem.totalLengthM).toBe('24.78');
    expect(tieItem.totalWeightKg).toBe('9.7881');

    expect(res.value.totalRebarWeightKg).toBe('30.9917');
  });

  // --------------------------------------------------------------------------
  // Example 4: Column - Method B (Site Practice Deductions)
  // --------------------------------------------------------------------------
  it('Example 4: Column - Method B (Site practice deductions)', () => {
    // Inputs: Same as Example 3, cuttingMethod = site-practice-method-b
    //
    // Main bars: 1 90° bend deduction = 2*d = 32 mm
    // Cut main = 3000 + 300 - 32 = 3268 mm = 3.268 m
    // Weight main = (4 * 3.268) * 1.58 = 13.072 * 1.58 = 20.65376 kg
    //
    // Lateral ties:
    // Core perimeter = 2*(220 + 320) = 1080 mm
    // 2 135° hooks = 2 * (6*8) = 96 mm
    // Deductions = 12d = 96 mm
    // Tie cut = 1080 + 96 - 96 = 1080 mm = 1.080 m
    // Weight ties = (21 * 1.080) * 0.395 = 22.680 * 0.395 = 8.9586 kg
    //
    // Total weight = 20.65376 + 8.9586 = 29.61236 kg

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
    expect(tieItem.singleBarCuttingLengthMm).toBe('1080');
    expect(tieItem.totalWeightKg).toBe('8.9586');

    expect(res.value.totalRebarWeightKg).toBe('29.61236');
  });
});
