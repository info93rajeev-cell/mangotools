import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { assumption, info, wastageAssumption } from '../../lib/notices.ts';
import { area, calculated, ceilWhole } from '../../lib/present.ts';
import { anyUnrealistic, toFt2 } from '../../lib/quantities.ts';
import { step } from '../../lib/working.ts';
import { type Computed, computeBrickwork } from './compute.ts';
import { type Measured, measure } from './measure.ts';
import {
  brickworkQuantityInputV2,
  brickworkQuantityOutputV2,
  brickworkQuantityParamsV2,
} from './schema.ts';

function notices(m: Measured): OpWarning[] {
  const list = [
    assumption('CIVIL_ASSUMPTION_MORTAR_JOINT', { joint: m.mortarJoint, unit: m.brickUnit }),
    assumption('CIVIL_ASSUMPTION_WYTHES', { wythes: m.wythes }),
    wastageAssumption(m.wastagePercent),
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_BRICKWORK_BEFORE_CONSTRUCTION'),
    info('CIVIL_BRICKWORK_CONDITIONS_VARY'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON'),
    info('CIVIL_BRICKWORK_SCOPE_LIMIT'),
  ];
  if (anyUnrealistic([m.wallLength, m.wallHeight], m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function working(m: Measured, c: Computed, orderBricks: string): WorkingStep[] {
  const { unit, brickUnit, mortarJoint: joint } = m;
  return [
    step(
      'grossWallArea',
      'brickwork2.grossWallArea',
      { length: m.wallLength, height: m.wallHeight, unit, quantity: m.quantity },
      c.grossWallAreaM2,
    ),
    step('openingArea', 'brickwork2.openingArea', { quantity: m.quantity }, c.openingAreaM2),
    step(
      'netWallArea',
      'brickwork2.netWallArea',
      { gross: c.grossWallAreaM2, openings: c.openingAreaM2 },
      c.netWallAreaM2,
    ),
    step(
      'brickFace',
      'brickwork2.brickFace',
      { length: m.brickLength, height: m.brickHeight, joint, brickUnit },
      c.brickFaceM2,
    ),
    step(
      'baseBricks',
      'brickwork2.baseBricks',
      { net: c.netWallAreaM2, face: c.brickFaceM2, wythes: m.wythes },
      c.baseBricks,
    ),
    step(
      'orderBricks',
      'brickwork2.orderBricks',
      { base: c.baseBricks, wastagePercent: m.wastagePercent, adjusted: c.adjustedBricks },
      orderBricks,
    ),
  ];
}

export const brickworkQuantityV2 = defineOperation({
  id: 'civil.brickwork.quantity',
  major: 2,
  title: 'Brickwork quantity (brick count, face-area method)',
  summary:
    'Bricks to order for a wall from net wall area (after repeatable openings), brick face size plus mortar joint, brick skins and an editable wastage allowance.',
  input: brickworkQuantityInputV2,
  params: brickworkQuantityParamsV2,
  output: brickworkQuantityOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_NOT_NEGATIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WYTHES_OUT_OF_RANGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
    'CIVIL_OPENINGS_INVALID',
    'CIVIL_OPENINGS_TOO_MANY',
    'CIVIL_DEDUCTIONS_EXCEED_AREA',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const m = measured.value;
    const computed = computeBrickwork(m);
    if (!computed.ok) return computed;
    const c = computed.value;
    const orderBricks = ceilWhole(c.adjustedBricks);
    return ok(
      {
        unit: m.unit,
        brickUnit: m.brickUnit,
        quantity: m.quantity,
        wythes: m.wythes,
        mortarJoint: m.mortarJoint,
        wastagePercent: m.wastagePercent,
        grossWallAreaM2: area(c.grossWallAreaM2),
        openingAreaM2: area(c.openingAreaM2),
        netWallAreaM2: area(c.netWallAreaM2),
        grossWallAreaFt2: area(toFt2(c.grossWallAreaM2)),
        openingAreaFt2: area(toFt2(c.openingAreaM2)),
        netWallAreaFt2: area(toFt2(c.netWallAreaM2)),
        baseBricks: calculated(c.baseBricks),
        wastageBricks: calculated(c.wastageBricks),
        orderBricks,
        working: working(m, c, orderBricks),
      },
      notices(m),
    );
  },
});
