import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { div, mul, sub, toFixedString } from '@mangotools/engine-numeric';
import { assumption, info } from '../../lib/notices.ts';
import { amount, ceilWhole, volume } from '../../lib/present.ts';
import {
  anyUnrealistic,
  inMetres,
  ratioWithAllowance,
  toFt3,
  toYd3,
  withAllowance,
} from '../../lib/quantities.ts';
import { CUBIC_METRES_PER_CUBIC_FOOT, PI } from '../../lib/units-v2.ts';
import { step } from '../../lib/working.ts';
import { type Measured, measure, type Shape } from './measure.ts';
import {
  concreteQuantityInputV2,
  concreteQuantityOutputV2,
  concreteQuantityParamsV2,
  type YieldUnit,
} from './schema.ts';

const CUBIC_METRES_PER_YIELD_UNIT: Readonly<Record<YieldUnit, string>> = {
  l: '0.001',
  m3: '1',
  ft3: CUBIC_METRES_PER_CUBIC_FOOT,
};

/** One member's exact volume in m³ and the working step that shows it. */
function memberVolume(shape: Shape, unit: Measured['unit']): [string, WorkingStep] {
  if (shape.kind === 'circular') {
    const radius = div(inMetres(shape.diameter, unit), '2', 20);
    const v = mul(mul(PI, mul(radius, radius)), inMetres(shape.height, unit));
    const vars = { diameter: shape.diameter, height: shape.height, unit };
    return [v, step('memberVolume', 'concrete2.circularVolume', vars, v)];
  }
  const { length, width, depth } = shape;
  const v = mul(mul(inMetres(length, unit), inMetres(width, unit)), inMetres(depth, unit));
  return [
    v,
    step('memberVolume', 'concrete2.rectangularVolume', { length, width, depth, unit }, v),
  ];
}

function dimensions(shape: Shape): string[] {
  return shape.kind === 'circular'
    ? [shape.diameter, shape.height]
    : [shape.length, shape.width, shape.depth];
}

function notices(m: Measured): OpWarning[] {
  const list = [
    m.overagePercent === '0'
      ? assumption('CIVIL_ASSUMPTION_NO_OVERAGE')
      : assumption('CIVIL_ASSUMPTION_OVERAGE', { percent: m.overagePercent }),
  ];
  if (m.bag) {
    const unit = { l: 'L', m3: 'm³', ft3: 'ft³' }[m.bag.unit];
    list.push(assumption('CIVIL_ASSUMPTION_BAG_YIELD', { yield: m.bag.yield, unit }));
  }
  list.push(
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_BEFORE_CONSTRUCTION'),
    info('CIVIL_LOCAL_PRACTICE_VARIES'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT'),
    info('CIVIL_VOLUME_ONLY'),
  );
  if (anyUnrealistic(dimensions(m.shape), m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function bagsFor(m: Measured, netVolume: string, working: WorkingStep[]) {
  if (!m.bag) return {};
  const yieldM3 = mul(m.bag.yield, CUBIC_METRES_PER_YIELD_UNIT[m.bag.unit]);
  const bags = ceilWhole(ratioWithAllowance(netVolume, yieldM3, m.overagePercent));
  working.push(step('bags', 'concrete2.bags', { yieldM3, yield: m.bag.yield }, bags));
  return { bagYield: m.bag.yield, bagYieldUnit: m.bag.unit, bags };
}

function displayed(
  value: string,
  decimals: number | null,
  legacy: (exact: string) => string,
): string {
  return decimals === null ? legacy(value) : toFixedString(value, decimals, 'half-up');
}

export const concreteQuantityV2 = defineOperation({
  id: 'civil.concrete.quantity',
  major: 2,
  title: 'Concrete quantity (volume, order volume and optional bags)',
  summary:
    'Geometric concrete volume for rectangular members or circular columns, an editable overage for the order volume, and optional bag count from a stated yield per bag.',
  input: concreteQuantityInputV2,
  params: concreteQuantityParamsV2,
  output: concreteQuantityOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const m = measured.value;
    const [oneMember, memberStep] = memberVolume(m.shape, m.unit);
    const netVolume = mul(oneMember, m.quantity);
    const orderVolume = withAllowance(netVolume, m.overagePercent);
    const working = [
      memberStep,
      step(
        'netVolume',
        'concrete2.netVolume',
        { member: oneMember, quantity: m.quantity },
        netVolume,
      ),
      step(
        'orderVolume',
        'concrete2.orderVolume',
        { net: netVolume, overagePercent: m.overagePercent },
        orderVolume,
      ),
    ];
    const bags = bagsFor(m, netVolume, working);
    return ok(
      {
        memberType: m.memberType,
        unit: m.unit,
        quantity: m.quantity,
        overagePercent: m.overagePercent,
        netVolumeM3: displayed(netVolume, m.displayDecimals, volume),
        netVolumeFt3: displayed(toFt3(netVolume), m.displayDecimals, amount),
        netVolumeYd3: displayed(toYd3(netVolume), m.displayDecimals, amount),
        overageVolumeM3: displayed(sub(orderVolume, netVolume), m.displayDecimals, volume),
        orderVolumeM3: displayed(orderVolume, m.displayDecimals, volume),
        orderVolumeFt3: displayed(toFt3(orderVolume), m.displayDecimals, amount),
        orderVolumeYd3: displayed(toYd3(orderVolume), m.displayDecimals, amount),
        ...bags,
        working,
      },
      notices(m),
    );
  },
});
