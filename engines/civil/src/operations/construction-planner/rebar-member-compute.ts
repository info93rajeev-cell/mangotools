/**
 * Member-specific reinforcement schedule computations:
 * - Footing (Bottom mesh X and Y per IS 2502 Table III Ref E or Method B)
 * - Column (Main longitudinal bars per Table III Ref D + lateral ties per Table VIII Ref A)
 * - Beam (Top/bottom bars per Table III Ref E + shear stirrups per Table VIII Ref A)
 * - Slab Zone (Main and distribution bars per Table III Ref E or Method B)
 */
import {
  buildBarScheduleItem,
  computeClosedTieLengths,
  computeLBentBarLengths,
  computeUBentBarLengths,
  methodLabel,
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
  const countX = Math.ceil((member.widthMm.value - 2 * c) / member.bottomMeshXSpacingMm.value) + 1;
  const baseX = member.lengthMm.value - 2 * c;
  const cutX = computeUBentBarLengths({ clearSpanMm: baseX, legMm: leg, dMm: dX, isA, k });

  const dY = member.bottomMeshYBarDiameterMm.value;
  const countY = Math.ceil((member.lengthMm.value - 2 * c) / member.bottomMeshYSpacingMm.value) + 1;
  const baseY = member.widthMm.value - 2 * c;
  const cutY = computeUBentBarLengths({ clearSpanMm: baseY, legMm: leg, dMm: dY, isA, k });

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-B1-X`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'footing',
      desc: 'Bottom mesh X direction',
      dMm: dX,
      calcCutMm: cutX.calcMm,
      specifiedCutMm: cutX.specifiedMm,
      barsPerMember: countX,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutX.dims,
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-B2-Y`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'footing',
      desc: 'Bottom mesh Y direction',
      dMm: dY,
      calcCutMm: cutY.calcMm,
      specifiedCutMm: cutY.specifiedMm,
      barsPerMember: countY,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutY.dims,
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
  const cutMain = computeLBentBarLengths({
    straightLengthMm: h,
    extMm: ext,
    dMm: dMain,
    isA,
    k,
  });

  const dTie = member.tieDiameterMm.value;
  const tieCount = Math.ceil(h / member.tieSpacingMm.value) + 1;
  const cutTie = computeClosedTieLengths({
    widthMm: member.widthMm.value,
    depthMm: member.depthMm.value,
    coverMm: c,
    dMm: dTie,
    isA,
    hookAngle: member.tieHookAngle.value,
    seismicHookMm: member.seismicHookLengthMm?.value,
    methodBHookMm: member.methodBStirrupHookMm?.value,
  });

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-M1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'column',
      desc: 'Longitudinal main bars',
      dMm: dMain,
      calcCutMm: cutMain.calcMm,
      specifiedCutMm: cutMain.specifiedMm,
      barsPerMember: member.mainBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: ext > 0 ? 'l-shape' : 'straight',
      dims: cutMain.dims,
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-T1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'column',
      desc: 'Lateral ties',
      dMm: dTie,
      calcCutMm: cutTie.calcMm,
      specifiedCutMm: cutTie.specifiedMm,
      barsPerMember: tieCount,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'closed-tie',
      dims: cutTie.dims,
    }),
  ];
}

function computeBeamStirrupItem(
  member: BeamMemberInput,
  span: number,
  isA: boolean,
  label: string,
): CalculatedBarScheduleItem {
  const dSt = member.stirrupDiameterMm.value;
  const stCount = Math.ceil(span / member.stirrupSpacingMm.value) + 1;
  const cutSt = computeClosedTieLengths({
    widthMm: member.widthMm.value,
    depthMm: member.depthMm.value,
    coverMm: member.clearCoverMm.value,
    dMm: dSt,
    isA,
    hookAngle: member.stirrupHookAngle.value,
    seismicHookMm: member.seismicHookLengthMm?.value,
    methodBHookMm: member.methodBStirrupHookMm?.value,
  });

  return buildBarScheduleItem({
    barMark: `${member.label}-S1`,
    memberId: member.id,
    memberLabel: member.label,
    memberType: 'beam',
    desc: 'Shear stirrups',
    dMm: dSt,
    calcCutMm: cutSt.calcMm,
    specifiedCutMm: cutSt.specifiedMm,
    barsPerMember: stCount,
    memberCount: member.count.value,
    methodLabel: label,
    shapeType: 'closed-tie',
    dims: cutSt.dims,
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
  const cutTop = computeUBentBarLengths({
    clearSpanMm: span,
    legMm: member.topBarEndHookLengthMm.value,
    dMm: dTop,
    isA,
    k,
  });
  const dBot = member.bottomBarDiameterMm.value;
  const cutBot = computeUBentBarLengths({
    clearSpanMm: span,
    legMm: member.bottomBarEndHookLengthMm.value,
    dMm: dBot,
    isA,
    k,
  });

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-T1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'beam',
      desc: 'Top hanger bars',
      dMm: dTop,
      calcCutMm: cutTop.calcMm,
      specifiedCutMm: cutTop.specifiedMm,
      barsPerMember: member.topBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutTop.dims,
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-B1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'beam',
      desc: 'Bottom tension bars',
      dMm: dBot,
      calcCutMm: cutBot.calcMm,
      specifiedCutMm: cutBot.specifiedMm,
      barsPerMember: member.bottomBarCount.value,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutBot.dims,
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
  const countMain = Math.ceil((member.lengthMm.value - 2 * c) / member.mainBarSpacingMm.value) + 1;
  const baseMain = member.widthMm.value - 2 * c;
  const cutMain = computeUBentBarLengths({
    clearSpanMm: baseMain,
    legMm: member.mainBarEndBendLegMm.value,
    dMm: dMain,
    isA,
    k,
  });

  const dDist = member.distBarDiameterMm.value;
  const countDist = Math.ceil((member.widthMm.value - 2 * c) / member.distBarSpacingMm.value) + 1;
  const baseDist = member.lengthMm.value - 2 * c;
  const cutDist = computeUBentBarLengths({
    clearSpanMm: baseDist,
    legMm: member.distBarEndBendLegMm.value,
    dMm: dDist,
    isA,
    k,
  });

  return [
    buildBarScheduleItem({
      barMark: `${member.label}-M1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'slab',
      desc: 'Main slab reinforcement',
      dMm: dMain,
      calcCutMm: cutMain.calcMm,
      specifiedCutMm: cutMain.specifiedMm,
      barsPerMember: countMain,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutMain.dims,
    }),
    buildBarScheduleItem({
      barMark: `${member.label}-D1`,
      memberId: member.id,
      memberLabel: member.label,
      memberType: 'slab',
      desc: 'Distribution reinforcement',
      dMm: dDist,
      calcCutMm: cutDist.calcMm,
      specifiedCutMm: cutDist.specifiedMm,
      barsPerMember: countDist,
      memberCount: mCount,
      methodLabel: label,
      shapeType: 'u-shape',
      dims: cutDist.dims,
    }),
  ];
}
