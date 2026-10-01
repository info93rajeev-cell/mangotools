import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { mul } from '@mangotools/engine-numeric';
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
import { CUBIC_METRES_PER_CUBIC_FOOT, CUBIC_METRES_PER_CUBIC_YARD } from '../../lib/units-v2.ts';
import { step } from '../../lib/working.ts';
import { type Measured, measure } from './measure.ts';
import {
  excavationVolumeInputV2,
  excavationVolumeOutputV2,
  excavationVolumeParamsV2,
  type TruckUnit,
} from './schema.ts';

const CUBIC_METRES_PER_TRUCK_UNIT: Readonly<Record<TruckUnit, string>> = {
  m3: '1',
  yd3: CUBIC_METRES_PER_CUBIC_YARD,
  ft3: CUBIC_METRES_PER_CUBIC_FOOT,
};
const TRUCK_UNIT_LABEL: Readonly<Record<TruckUnit, string>> = { m3: 'm³', yd3: 'yd³', ft3: 'ft³' };

function notices(m: Measured): OpWarning[] {
  const list: OpWarning[] = [];
  if (m.swellPercent !== '0') {
    list.push(assumption('CIVIL_ASSUMPTION_SWELL', { percent: m.swellPercent }));
  }
  if (m.truck) {
    const unit = TRUCK_UNIT_LABEL[m.truck.unit];
    list.push(assumption('CIVIL_ASSUMPTION_TRUCK', { capacity: m.truck.capacity, unit }));
  }
  list.push(
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_BEFORE_EXCAVATION'),
    info('CIVIL_EXCAVATION_CONDITIONS_VARY'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR'),
    info('CIVIL_EXCAVATION_SCOPE_LIMIT_V2'),
  );
  if (anyUnrealistic([m.length, m.width, m.depth], m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function looseOutputs(m: Measured, bank: string, working: WorkingStep[]) {
  if (m.swellPercent === '0') return { loose: bank, outputs: {} };
  const loose = withAllowance(bank, m.swellPercent);
  working.push(
    step('looseVolume', 'excavation2.looseVolume', { bank, swellPercent: m.swellPercent }, loose),
  );
  const outputs = {
    looseVolumeM3: volume(loose),
    looseVolumeFt3: amount(toFt3(loose)),
    looseVolumeYd3: amount(toYd3(loose)),
  };
  return { loose, outputs };
}

function truckOutputs(m: Measured, bank: string, working: WorkingStep[]) {
  if (!m.truck) return {};
  const capacityM3 = mul(m.truck.capacity, CUBIC_METRES_PER_TRUCK_UNIT[m.truck.unit]);
  const loads = ceilWhole(ratioWithAllowance(bank, capacityM3, m.swellPercent));
  working.push(step('truckLoads', 'excavation2.truckLoads', { capacityM3 }, loads));
  return { truckCapacity: m.truck.capacity, truckCapacityUnit: m.truck.unit, truckLoads: loads };
}

export const excavationVolumeV2 = defineOperation({
  id: 'civil.excavation.volume',
  major: 2,
  title: 'Excavation volume (bank volume, optional swell and truck loads)',
  summary:
    'Bank (in-situ) excavation volume for rectangular pits or trenches, with an optional editable swell for loose volume and optional truck loads from a user-supplied usable truck volume.',
  input: excavationVolumeInputV2,
  params: excavationVolumeParamsV2,
  output: excavationVolumeOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_SWELL_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    const measured = measure(input);
    if (!measured.ok) return measured;
    const m = measured.value;
    const { length, width, depth, unit, quantity } = m;
    const one = mul(mul(inMetres(length, unit), inMetres(width, unit)), inMetres(depth, unit));
    const bank = mul(one, quantity);
    const working = [
      step('bankVolume', 'excavation2.bankVolume', { length, width, depth, unit, quantity }, bank),
    ];
    const loose = looseOutputs(m, bank, working);
    const trucks = truckOutputs(m, bank, working);
    return ok(
      {
        excavationType: m.excavationType,
        unit,
        quantity,
        swellPercent: m.swellPercent,
        bankVolumeM3: volume(bank),
        bankVolumeFt3: amount(toFt3(bank)),
        bankVolumeYd3: amount(toYd3(bank)),
        ...loose.outputs,
        ...trucks,
        working,
      },
      notices(m),
    );
  },
});
