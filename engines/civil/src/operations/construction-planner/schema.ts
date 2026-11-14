import { z } from 'zod';

export const inputOrigins = ['typed', 'pdf-text-suggestion', 'ai-suggestion'] as const;
export const cuttingMethods = ['is2502-method-a', 'site-practice-method-b'] as const;
export const memberTypes = ['footing', 'column', 'beam', 'slab'] as const;
export const hookAngles = [90, 135, 180] as const;
export const is2502Factors = [2, 3, 4, 6] as const;

/**
 * Creates a Zod schema for a TrackedValue.
 * Strictly enforces that confirmedByUser is true before entering engine computation.
 */
export function trackedValueSchema<T extends z.ZodTypeAny>(innerSchema: T) {
  return z
    .strictObject({
      value: innerSchema,
      origin: z.enum(inputOrigins),
      confirmedByUser: z.boolean(),
    })
    .refine((data) => data.confirmedByUser === true, {
      message: 'CIVIL_UNCONFIRMED_INPUT',
      path: ['confirmedByUser'],
    });
}

const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().nonnegative();
const positiveInt = z.number().int().positive();
const stringNonEmpty = z.string().min(1);

const baseMemberSchema = z.strictObject({
  id: stringNonEmpty,
  label: stringNonEmpty,
  count: trackedValueSchema(positiveInt),
  concreteGrade: trackedValueSchema(stringNonEmpty),
  steelGrade: trackedValueSchema(stringNonEmpty),
  clearCoverMm: trackedValueSchema(nonNegativeNumber),
  cuttingMethod: trackedValueSchema(z.enum(cuttingMethods)),
  is2502KFactor: trackedValueSchema(
    z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]),
  ).optional(),
});

export const footingMemberSchema = baseMemberSchema.extend({
  memberType: z.literal('footing'),
  lengthMm: trackedValueSchema(positiveNumber),
  widthMm: trackedValueSchema(positiveNumber),
  depthMm: trackedValueSchema(positiveNumber),
  bottomMeshXBarDiameterMm: trackedValueSchema(positiveNumber),
  bottomMeshXSpacingMm: trackedValueSchema(positiveNumber),
  bottomMeshYBarDiameterMm: trackedValueSchema(positiveNumber),
  bottomMeshYSpacingMm: trackedValueSchema(positiveNumber),
  bendLegHeightMm: trackedValueSchema(nonNegativeNumber).optional(),
});

export const columnMemberSchema = baseMemberSchema.extend({
  memberType: z.literal('column'),
  widthMm: trackedValueSchema(positiveNumber),
  depthMm: trackedValueSchema(positiveNumber),
  heightMm: trackedValueSchema(positiveNumber),
  mainBarDiameterMm: trackedValueSchema(positiveNumber),
  mainBarCount: trackedValueSchema(positiveInt),
  mainBarLapOrEndExtensionMm: trackedValueSchema(nonNegativeNumber).optional(),
  tieDiameterMm: trackedValueSchema(positiveNumber),
  tieSpacingMm: trackedValueSchema(positiveNumber),
  tieHookAngle: trackedValueSchema(z.union([z.literal(90), z.literal(135), z.literal(180)])),
  seismicHookLengthMm: trackedValueSchema(nonNegativeNumber).optional(),
  methodBStirrupHookMm: trackedValueSchema(nonNegativeNumber).optional(),
});

export const beamMemberSchema = baseMemberSchema.extend({
  memberType: z.literal('beam'),
  widthMm: trackedValueSchema(positiveNumber),
  depthMm: trackedValueSchema(positiveNumber),
  lengthMm: trackedValueSchema(positiveNumber),
  topBarDiameterMm: trackedValueSchema(positiveNumber),
  topBarCount: trackedValueSchema(positiveInt),
  topBarEndHookLengthMm: trackedValueSchema(nonNegativeNumber).optional(),
  bottomBarDiameterMm: trackedValueSchema(positiveNumber),
  bottomBarCount: trackedValueSchema(positiveInt),
  bottomBarEndHookLengthMm: trackedValueSchema(nonNegativeNumber).optional(),
  stirrupDiameterMm: trackedValueSchema(positiveNumber),
  stirrupSpacingMm: trackedValueSchema(positiveNumber),
  stirrupHookAngle: trackedValueSchema(z.union([z.literal(90), z.literal(135), z.literal(180)])),
  seismicHookLengthMm: trackedValueSchema(nonNegativeNumber).optional(),
  methodBStirrupHookMm: trackedValueSchema(nonNegativeNumber).optional(),
});

export const slabZoneMemberSchema = baseMemberSchema.extend({
  memberType: z.literal('slab'),
  lengthMm: trackedValueSchema(positiveNumber),
  widthMm: trackedValueSchema(positiveNumber),
  thicknessMm: trackedValueSchema(positiveNumber),
  mainBarDiameterMm: trackedValueSchema(positiveNumber),
  mainBarSpacingMm: trackedValueSchema(positiveNumber),
  mainBarEndBendLegMm: trackedValueSchema(nonNegativeNumber).optional(),
  distBarDiameterMm: trackedValueSchema(positiveNumber),
  distBarSpacingMm: trackedValueSchema(positiveNumber),
  distBarEndBendLegMm: trackedValueSchema(nonNegativeNumber).optional(),
});

export const constructionMemberSchema = z
  .discriminatedUnion('memberType', [
    footingMemberSchema,
    columnMemberSchema,
    beamMemberSchema,
    slabZoneMemberSchema,
  ])
  .refine(
    (member) => {
      if (member.cuttingMethod.value === 'is2502-method-a') {
        return member.is2502KFactor?.confirmedByUser === true;
      }
      return true;
    },
    {
      message: 'CIVIL_MISSING_IS2502_K_FACTOR',
      path: ['is2502KFactor'],
    },
  )
  .refine(
    (member) => {
      if (member.cuttingMethod.value !== 'is2502-method-a') {
        return true;
      }
      if (member.memberType === 'footing') {
        return !member.bendLegHeightMm || member.bendLegHeightMm.value <= 0;
      }
      if (member.memberType === 'column') {
        return !member.mainBarLapOrEndExtensionMm || member.mainBarLapOrEndExtensionMm.value <= 0;
      }
      if (member.memberType === 'beam') {
        const top = !member.topBarEndHookLengthMm || member.topBarEndHookLengthMm.value <= 0;
        const bot = !member.bottomBarEndHookLengthMm || member.bottomBarEndHookLengthMm.value <= 0;
        return top && bot;
      }
      if (member.memberType === 'slab') {
        const main = !member.mainBarEndBendLegMm || member.mainBarEndBendLegMm.value <= 0;
        const dist = !member.distBarEndBendLegMm || member.distBarEndBendLegMm.value <= 0;
        return main && dist;
      }
      return true;
    },
    {
      message:
        'IS 2502 method supports standard end bends only for this shape — use Site Practice method or enter a standard bend',
      path: ['cuttingMethod'],
    },
  );

export const constructionPlannerInput = z.strictObject({
  projectId: stringNonEmpty,
  projectName: stringNonEmpty,
  members: z.array(constructionMemberSchema),
});

export const constructionPlannerParams = z.strictObject({});

export const barScheduleItemSchema = z.strictObject({
  barMark: z.string(),
  memberId: z.string(),
  memberLabel: z.string(),
  memberType: z.enum(memberTypes),
  description: z.string(),
  diameterMm: z.string(),
  calculatedCuttingLengthMm: z.string(),
  singleBarCuttingLengthMm: z.string(),
  singleBarCuttingLengthM: z.string(),
  barsPerMember: z.string(),
  totalBarCount: z.string(),
  totalLengthM: z.string(),
  unitWeightKgPerM: z.string(),
  totalWeightKg: z.string(),
  totalWeightTonnes: z.string(),
  cuttingMethodLabel: z.string(),
  shapeDetails: z.strictObject({
    shapeType: z.enum(['straight', 'bent-up', 'u-shape', 'closed-tie', 'l-shape']),
    dimensionsMm: z.record(z.string(), z.string()),
  }),
});

export const memberCalculationResultSchema = z.strictObject({
  memberId: z.string(),
  memberLabel: z.string(),
  memberType: z.enum(memberTypes),
  memberCount: z.string(),
  concreteGrade: z.string(),
  concreteVolumeM3PerMember: z.string(),
  totalConcreteVolumeM3: z.string(),
  rebarItems: z.array(barScheduleItemSchema),
  totalRebarWeightKg: z.string(),
  totalRebarWeightTonnes: z.string(),
});

export const rebarDiameterSummarySchema = z.strictObject({
  diameterMm: z.string(),
  totalLengthM: z.string(),
  totalWeightKg: z.string(),
  totalWeightTonnes: z.string(),
});

export const memberTypeSummarySchema = z.strictObject({
  memberType: z.enum(memberTypes),
  concreteVolumeM3: z.string(),
  totalRebarWeightKg: z.string(),
  totalRebarWeightTonnes: z.string(),
});

export const concreteGradeSummarySchema = z.strictObject({
  concreteGrade: z.string(),
  volumeM3: z.string(),
});

export const constructionPlannerOutput = z.strictObject({
  projectId: z.string(),
  projectName: z.string(),
  totalConcreteVolumeM3: z.string(),
  totalRebarWeightKg: z.string(),
  totalRebarWeightTonnes: z.string(),
  members: z.array(memberCalculationResultSchema),
  bbsItems: z.array(barScheduleItemSchema),
  summaryByDiameter: z.array(rebarDiameterSummarySchema),
  summaryByMemberType: z.array(memberTypeSummarySchema),
  summaryByConcreteGrade: z.array(concreteGradeSummarySchema),
});

export type ConstructionPlannerInput = z.infer<typeof constructionPlannerInput>;
export type ConstructionPlannerOutput = z.infer<typeof constructionPlannerOutput>;
