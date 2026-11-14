/**
 * Member-specific reinforcement schedule computations:
 * - Footing (Bottom mesh X and Y)
 * - Column (Main longitudinal bars + lateral ties)
 * - Beam (Top hanger bars, bottom tension bars, shear stirrups)
 * - Slab Zone (Main short-span bars, distribution long-span bars)
 */
import {
  buildBarScheduleItem,
  computeClosedTieCutMm,
  computeUBentBarCutMm,
  is2502BendAllowance,
  methodLabel,
  stirrupHookExtension,
} from './rebar-compute.ts';
import type {
  BeamMemberInput,
  CalculatedBarScheduleItem,
  ColumnMemberInput,
  FootingMemberInput,
  SlabZoneMemberInput,
} from './types.ts';

export function computeFootingRebar(member: FootingMemberInput): CalculatedBarScheduleItem[] {
  const c = member.clearCoverMm.value;
  const isA = member.cuttingMethod.value === 'is2502-method-a';
  const k = member.is2502KFactor?.value ?? 3;
  const leg = member.bendLegHeightMm.value;
  const mCount = member.count.value;
  const label = methodLabel(member.cuttingMethod.value, k);

  const dX = member.bottomMeshXBarDiameterMm.value;
  const countX = Math.floor((member.widthMm.value - 2 * c) / member.bottomMeshXSpacingMm.value) + 1;
  const baseX = member.lengthMm.value - 2 * c;
  const cutX = computeUBentBarCutMm(baseX, leg, dX, isA, k);

  const dY = member.bottomMeshYBarDiameterMm.value;
  const countY =
    Math.floor((member.lengthMm.value - 2 * c) / member.bottomMeshYSpacingMm.value) + 1;
  const baseY = member.widthMm.value - 2 * c;
  const cutY = computeUBentBarCutMm(baseY, leg, dY, isA, k);

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-B1-X`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'footing',
      desc: 'Bottom mesh X direction',
      dMm: dX,
      cutMm: cutX,
      barsPerMember: countX,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { base: String(baseX), leg: String(leg) },
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-B2-Y`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'footing',
      desc: 'Bottom mesh Y direction',
      dMm: dY,
      cutMm: cutY,
      barsPerMember: countY,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { base: String(baseY), leg: String(leg) },
    }),
  ];
}

export function computeColumnRebar(member: ColumnMemberInput): CalculatedBarScheduleItem[] {
  const c = member.clearCoverMm.value;
  const isA = member.cuttingMethod.value === 'is2502-method-a';
  const k = member.is2502KFactor?.value ?? 3;
  const mCount = member.count.value;
  const label = methodLabel(member.cuttingMethod.value, k);

  const dMain = member.mainBarDiameterMm.value;
  const ext = member.mainBarLapOrEndExtensionMm.value;
  const h = member.heightMm.value;
  const bMain = isA ? is2502BendAllowance(k, dMain) : 0;
  const cutMain = ext > 0 ? (isA ? h + ext + bMain : h + ext - 2 * dMain) : h;

  const dTie = member.tieDiameterMm.value;
  const tieCount = Math.floor(h / member.tieSpacingMm.value) + 1;
  const tieA = member.widthMm.value - 2 * c;
  const tieB = member.depthMm.value - 2 * c;
  const hookAngle = member.tieHookAngle.value;
  const seisMm = member.seismicHookLengthMm?.value;
  const cutTie = computeClosedTieCutMm(tieA, tieB, dTie, hookAngle, seisMm, isA);

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-M1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'column',
      desc: 'Longitudinal main bars',
      dMm: dMain,
      cutMm: cutMain,
      barsPerMember: member.mainBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: ext > 0 ? 'l-shape' : 'straight',
      dims: { height: String(h), extension: String(ext) },
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-T1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'column',
      desc: 'Lateral ties',
      dMm: dTie,
      cutMm: cutTie,
      barsPerMember: tieCount,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'closed-tie',
      dims: {
        a: String(tieA),
        b: String(tieB),
        hook: String(stirrupHookExtension(dTie, hookAngle, seisMm)),
      },
    }),
  ];
}

function computeBeamStirrupItem(
  member: BeamMemberInput,
  span: number,
  isA: boolean,
  label: string,
): CalculatedBarScheduleItem {
  const c = member.clearCoverMm.value;
  const dSt = member.stirrupDiameterMm.value;
  const stCount = Math.floor(span / member.stirrupSpacingMm.value) + 1;
  const stA = member.widthMm.value - 2 * c;
  const stB = member.depthMm.value - 2 * c;
  const hookAngle = member.stirrupHookAngle.value;
  const seisMm = member.seismicHookLengthMm?.value;
  const cutSt = computeClosedTieCutMm(stA, stB, dSt, hookAngle, seisMm, isA);

  return buildBarScheduleItem({
    barMark: `${member.label}-S1`,
    memberId: member.id,
    memberLabel: member.label,
    memberType: 'beam',
    desc: 'Shear stirrups',
    dMm: dSt,
    cutMm: cutSt,
    barsPerMember: stCount,
    memberCount: member.count.value,
    methodLabel: label,
    shapeType: 'closed-tie',
    dims: {
      a: String(stA),
      b: String(stB),
      hook: String(stirrupHookExtension(dSt, hookAngle, seisMm)),
    },
  });
}

export function computeBeamRebar(member: BeamMemberInput): CalculatedBarScheduleItem[] {
  const c = member.clearCoverMm.value;
  const isA = member.cuttingMethod.value === 'is2502-method-a';
  const k = member.is2502KFactor?.value ?? 3;
  const mCount = member.count.value;
  const label = methodLabel(member.cuttingMethod.value, k);
  const span = member.lengthMm.value - 2 * c;

  const dTop = member.topBarDiameterMm.value;
  const cutTop = computeUBentBarCutMm(span, member.topBarEndHookLengthMm.value, dTop, isA, k);
  const dBot = member.bottomBarDiameterMm.value;
  const cutBot = computeUBentBarCutMm(span, member.bottomBarEndHookLengthMm.value, dBot, isA, k);

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-T1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'beam',
      desc: 'Top hanger bars',
      dMm: dTop,
      cutMm: cutTop,
      barsPerMember: member.topBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { span: String(span), hook: String(member.topBarEndHookLengthMm.value) },
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-B1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'beam',
      desc: 'Bottom tension bars',
      dMm: dBot,
      cutMm: cutBot,
      barsPerMember: member.bottomBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { span: String(span), hook: String(member.bottomBarEndHookLengthMm.value) },
    }),
    computeBeamStirrupItem(member, span, isA, label),
  ];
}

export function computeSlabRebar(member: SlabZoneMemberInput): CalculatedBarScheduleItem[] {
  const c = member.clearCoverMm.value;
  const isA = member.cuttingMethod.value === 'is2502-method-a';
  const k = member.is2502KFactor?.value ?? 3;
  const mCount = member.count.value;
  const label = methodLabel(member.cuttingMethod.value, k);

  const dMain = member.mainBarDiameterMm.value;
  const countMain = Math.floor((member.lengthMm.value - 2 * c) / member.mainBarSpacingMm.value) + 1;
  const baseMain = member.widthMm.value - 2 * c;
  const cutMain = computeUBentBarCutMm(baseMain, member.mainBarEndBendLegMm.value, dMain, isA, k);

  const dDist = member.distBarDiameterMm.value;
  const countDist = Math.floor((member.widthMm.value - 2 * c) / member.distBarSpacingMm.value) + 1;
  const baseDist = member.lengthMm.value - 2 * c;
  const cutDist = computeUBentBarCutMm(baseDist, member.distBarEndBendLegMm.value, dDist, isA, k);

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-M1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'slab',
      desc: 'Main slab reinforcement',
      dMm: dMain,
      cutMm: cutMain,
      barsPerMember: countMain,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { base: String(baseMain), leg: String(member.mainBarEndBendLegMm.value) },
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-D1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'slab',
      desc: 'Distribution reinforcement',
      dMm: dDist,
      cutMm: cutDist,
      barsPerMember: countDist,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: { base: String(baseDist), leg: String(member.distBarEndBendLegMm.value) },
    }),
  ];
}
