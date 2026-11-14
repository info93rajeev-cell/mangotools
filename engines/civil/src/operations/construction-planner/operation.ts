import { defineOperation, ok } from '@mangotools/core';
import { add } from '@mangotools/engine-numeric';
import { rebarTotalTonnes } from '../../lib/rebar-weight.ts';
import {
  summarizeByConcreteGrade,
  summarizeByDiameter,
  summarizeByMemberType,
} from './bbs-compute.ts';
import {
  computeSingleMemberConcreteVolumeM3,
  computeTotalMemberConcreteVolumeM3,
} from './concrete-compute.ts';
import {
  computeBeamRebar,
  computeColumnRebar,
  computeFootingRebar,
  computeSlabRebar,
} from './rebar-member-compute.ts';
import {
  type ConstructionPlannerInput,
  constructionPlannerInput,
  constructionPlannerOutput,
  constructionPlannerParams,
} from './schema.ts';
import type {
  CalculatedBarScheduleItem,
  ConstructionMemberInput,
  ConstructionPlannerEngineOutput,
  MemberCalculationResult,
} from './types.ts';

function computeMemberResult(member: ConstructionMemberInput): MemberCalculationResult {
  const volSingle = computeSingleMemberConcreteVolumeM3(member);
  const volTotal = computeTotalMemberConcreteVolumeM3(member, volSingle);

  let rebarItems: CalculatedBarScheduleItem[];
  switch (member.memberType) {
    case 'footing':
      rebarItems = computeFootingRebar(member);
      break;
    case 'column':
      rebarItems = computeColumnRebar(member);
      break;
    case 'beam':
      rebarItems = computeBeamRebar(member);
      break;
    case 'slab':
      rebarItems = computeSlabRebar(member);
      break;
  }

  let totalRebarKg = '0';
  for (const item of rebarItems) {
    totalRebarKg = add(totalRebarKg, item.totalWeightKg);
  }

  return {
    memberId: member.id,
    memberLabel: member.label,
    memberType: member.memberType,
    memberCount: String(member.count.value),
    concreteGrade: member.concreteGrade.value,
    concreteVolumeM3PerMember: volSingle,
    totalConcreteVolumeM3: volTotal,
    rebarItems,
    totalRebarWeightKg: totalRebarKg,
    totalRebarWeightTonnes: rebarTotalTonnes(totalRebarKg),
  };
}

export function computePlannerOutput(
  projectId: string,
  projectName: string,
  members: ConstructionMemberInput[],
): ConstructionPlannerEngineOutput {
  const memberResults = members.map(computeMemberResult);
  const allBbsItems: CalculatedBarScheduleItem[] = memberResults.flatMap((m) => m.rebarItems);

  let totalConcreteM3 = '0';
  let totalRebarKg = '0';
  for (const m of memberResults) {
    totalConcreteM3 = add(totalConcreteM3, m.totalConcreteVolumeM3);
    totalRebarKg = add(totalRebarKg, m.totalRebarWeightKg);
  }

  return {
    projectId,
    projectName,
    totalConcreteVolumeM3: totalConcreteM3,
    totalRebarWeightKg: totalRebarKg,
    totalRebarWeightTonnes: rebarTotalTonnes(totalRebarKg),
    members: memberResults,
    bbsItems: allBbsItems,
    summaryByDiameter: summarizeByDiameter(allBbsItems),
    summaryByMemberType: summarizeByMemberType(memberResults),
    summaryByConcreteGrade: summarizeByConcreteGrade(memberResults),
  };
}

export const constructionPlanner = defineOperation({
  id: 'civil.construction.planner',
  major: 1,
  title: 'Construction Project Planner (concrete, rebar, BBS)',
  summary:
    'Full construction member planning engine: concrete volume, rebar cutting length via IS 2502 Method A (allowances) or Method B (site practice deductions), and consolidated BBS schedules.',
  input: constructionPlannerInput,
  params: constructionPlannerParams,
  output: constructionPlannerOutput,
  errors: ['CIVIL_UNCONFIRMED_INPUT', 'CIVIL_MISSING_IS2502_K_FACTOR', 'CIVIL_NO_MEMBERS_ENTERED'],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input: ConstructionPlannerInput) {
    return ok(computePlannerOutput(input.projectId, input.projectName, input.members));
  },
});
