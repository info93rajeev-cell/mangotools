/**
 * Types and domain interfaces for Construction Project Planner Engine.
 * Supports TrackedValue<T> for Level 1, 2, and 3 drawing assist provenance.
 */

export type InputOrigin = 'typed' | 'pdf-text-suggestion' | 'ai-suggestion';

/**
 * Value wrapper carrying provenance and explicit user confirmation flag.
 * Only confirmed values (confirmedByUser === true) are permitted into engineering calculations.
 */
export interface TrackedValue<T> {
  value: T;
  origin: InputOrigin;
  confirmedByUser: boolean;
}

export type CuttingMethod = 'is2502-method-a' | 'site-practice-method-b';

export type IS2502KFactor = 2 | 3 | 4 | 6;

export type MemberType = 'footing' | 'column' | 'beam' | 'slab';

export interface BaseMemberInput {
  id: string;
  label: string;
  count: TrackedValue<number>;
  concreteGrade: TrackedValue<string>;
  steelGrade: TrackedValue<string>;
  clearCoverMm: TrackedValue<number>;
  cuttingMethod: TrackedValue<CuttingMethod>;
  /** Required when cuttingMethod is is2502-method-a: factor k in {2, 3, 4, 6} */
  is2502KFactor?: TrackedValue<2 | 3 | 4 | 6>;
}

export interface FootingMemberInput extends BaseMemberInput {
  memberType: 'footing';
  lengthMm: TrackedValue<number>;
  widthMm: TrackedValue<number>;
  depthMm: TrackedValue<number>;
  /** Bottom reinforcement along length (X direction) */
  bottomMeshXBarDiameterMm: TrackedValue<number>;
  bottomMeshXSpacingMm: TrackedValue<number>;
  /** Bottom reinforcement along width (Y direction) */
  bottomMeshYBarDiameterMm: TrackedValue<number>;
  bottomMeshYSpacingMm: TrackedValue<number>;
  /** Optional specified vertical bend leg height (mm). If omitted, standard end bend per IS 2502 Table III Ref E is used. */
  bendLegHeightMm?: TrackedValue<number>;
}

export interface ColumnMemberInput extends BaseMemberInput {
  memberType: 'column';
  widthMm: TrackedValue<number>;
  depthMm: TrackedValue<number>;
  heightMm: TrackedValue<number>;
  /** Main longitudinal bars */
  mainBarDiameterMm: TrackedValue<number>;
  mainBarCount: TrackedValue<number>;
  /** Optional longitudinal lap or starter crank / extension (mm). If omitted, standard end bend per IS 2502 Table III Ref D is used. */
  mainBarLapOrEndExtensionMm?: TrackedValue<number>;
  /** Lateral ties / stirrups */
  tieDiameterMm: TrackedValue<number>;
  tieSpacingMm: TrackedValue<number>;
  tieHookAngle: TrackedValue<90 | 135 | 180>;
  /** Optional custom seismic 135° hook extension (mm). If omitted, IS 456 Cl. 26.2.2.4(b) is used. */
  seismicHookLengthMm?: TrackedValue<number>;
  /** Method B stirrup/tie hook length (mm) entered by user (no pre-filled code default) */
  methodBStirrupHookMm?: TrackedValue<number>;
}

export interface BeamMemberInput extends BaseMemberInput {
  memberType: 'beam';
  widthMm: TrackedValue<number>;
  depthMm: TrackedValue<number>;
  lengthMm: TrackedValue<number>; // Span
  /** Top hanger / longitudinal bars */
  topBarDiameterMm: TrackedValue<number>;
  topBarCount: TrackedValue<number>;
  /** Optional top end anchor development or L-bend hook length (mm). If omitted, standard end bend per Table III Ref E is used. */
  topBarEndHookLengthMm?: TrackedValue<number>;
  /** Bottom tensile longitudinal bars */
  bottomBarDiameterMm: TrackedValue<number>;
  bottomBarCount: TrackedValue<number>;
  /** Optional bottom end anchor development or L-bend hook length (mm). If omitted, standard end bend per Table III Ref E is used. */
  bottomBarEndHookLengthMm?: TrackedValue<number>;
  /** Shear stirrups */
  stirrupDiameterMm: TrackedValue<number>;
  stirrupSpacingMm: TrackedValue<number>;
  stirrupHookAngle: TrackedValue<90 | 135 | 180>;
  seismicHookLengthMm?: TrackedValue<number>;
  /** Method B stirrup hook length (mm) entered by user (no pre-filled code default) */
  methodBStirrupHookMm?: TrackedValue<number>;
}

export interface SlabZoneMemberInput extends BaseMemberInput {
  memberType: 'slab';
  lengthMm: TrackedValue<number>;
  widthMm: TrackedValue<number>;
  thicknessMm: TrackedValue<number>;
  /** Main reinforcement (short span) */
  mainBarDiameterMm: TrackedValue<number>;
  mainBarSpacingMm: TrackedValue<number>;
  /** Optional main bar end bend leg height (mm). If omitted, standard end bend per Table III Ref E is used. */
  mainBarEndBendLegMm?: TrackedValue<number>;
  /** Distribution reinforcement (long span) */
  distBarDiameterMm: TrackedValue<number>;
  distBarSpacingMm: TrackedValue<number>;
  /** Optional distribution bar end bend leg height (mm). If omitted, standard end bend per Table III Ref E is used. */
  distBarEndBendLegMm?: TrackedValue<number>;
}

export type ConstructionMemberInput =
  | FootingMemberInput
  | ColumnMemberInput
  | BeamMemberInput
  | SlabZoneMemberInput;

export interface ConstructionPlannerEngineInput {
  projectId: string;
  projectName: string;
  members: ConstructionMemberInput[];
}

export interface CalculatedBarScheduleItem {
  barMark: string;
  memberId: string;
  memberLabel: string;
  memberType: MemberType;
  description: string;
  diameterMm: string;
  /** Exact calculated cutting length before standard rounding (mm) */
  calculatedCuttingLengthMm: string;
  /** Specified cutting length (IS 2502 Cl. 5.1.1 rounded to next whole 25mm in Method A, or calculated mm in Method B) */
  singleBarCuttingLengthMm: string;
  singleBarCuttingLengthM: string;
  barsPerMember: string;
  totalBarCount: string;
  totalLengthM: string;
  unitWeightKgPerM: string;
  totalWeightKg: string;
  totalWeightTonnes: string;
  cuttingMethodLabel: string;
  shapeDetails: {
    shapeType: 'straight' | 'bent-up' | 'u-shape' | 'closed-tie' | 'l-shape';
    dimensionsMm: Record<string, string>;
  };
}

export interface MemberCalculationResult {
  memberId: string;
  memberLabel: string;
  memberType: MemberType;
  memberCount: string;
  concreteGrade: string;
  concreteVolumeM3PerMember: string;
  totalConcreteVolumeM3: string;
  rebarItems: CalculatedBarScheduleItem[];
  totalRebarWeightKg: string;
  totalRebarWeightTonnes: string;
}

export interface RebarDiameterSummary {
  diameterMm: string;
  totalLengthM: string;
  totalWeightKg: string;
  totalWeightTonnes: string;
}

export interface MemberTypeSummary {
  memberType: MemberType;
  concreteVolumeM3: string;
  totalRebarWeightKg: string;
  totalRebarWeightTonnes: string;
}

export interface ConcreteGradeSummary {
  concreteGrade: string;
  volumeM3: string;
}

export interface ConstructionPlannerEngineOutput {
  projectId: string;
  projectName: string;
  totalConcreteVolumeM3: string;
  totalRebarWeightKg: string;
  totalRebarWeightTonnes: string;
  members: MemberCalculationResult[];
  bbsItems: CalculatedBarScheduleItem[];
  summaryByDiameter: RebarDiameterSummary[];
  summaryByMemberType: MemberTypeSummary[];
  summaryByConcreteGrade: ConcreteGradeSummary[];
}
