import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { mul, sub, toFixedString } from '@mangotools/engine-numeric';
import { assumption, info, wastageAssumption } from '../../lib/notices.ts';
import { checkDeductions, openingsArea } from '../../lib/openings.ts';
import { amount, area, ceilWhole, volume } from '../../lib/present.ts';
import {
  anyUnrealistic,
  areaInM2,
  inMetres,
  ratioWithAllowance,
  toFt2,
  toFt3,
  withAllowance,
} from '../../lib/quantities.ts';
import { METRES_PER_UNIT } from '../../lib/units-v2.ts';
import { step } from '../../lib/working.ts';
import { type Measured, measure } from './measure.ts';
import {
  plasterQuantityInputV2,
  plasterQuantityOutputV2,
  plasterQuantityParamsV2,
} from './schema.ts';

function notices(m: Measured): OpWarning[] {
  const list = [wastageAssumption(m.wastagePercent)];
  list.push(
    m.bagVolumeM3
      ? assumption('CIVIL_ASSUMPTION_PLASTER_PRODUCT')
      : info('CIVIL_INFO_PLASTER_MATERIAL'),
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_PLASTER_BEFORE_CONSTRUCTION'),
    info('CIVIL_PLASTER_CONDITIONS_VARY'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_MASON'),
    info('CIVIL_PLASTER_SCOPE_LIMIT'),
  );
  if (anyUnrealistic([m.length, m.secondDimension], m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function areas(m: Measured) {
  const grossOne = mul(inMetres(m.length, m.unit), inMetres(m.secondDimension, m.unit));
  const openingOne = areaInM2(openingsArea(m.openings), m.unit);
  const fits = checkDeductions(grossOne, openingOne);
  if (!fits.ok) return fits;
  const gross = mul(grossOne, m.quantity);
  const openings = mul(openingOne, m.quantity);
  return ok({ gross, openings, net: sub(gross, openings) });
}

function displayed(
  value: string,
  decimals: number | null,
  legacy: (exact: string) => string,
): string {
  return decimals === null ? legacy(value) : toFixedString(value, decimals, 'half-up');
}

export const plasterQuantityV2 = defineOperation({
  id: 'civil.plaster.quantity',
  major: 2,
  title: 'Plaster quantity (application volume, optional bags from product data)',
  summary:
    'Net plaster area after repeatable openings, application (wet) volume from thickness, an editable wastage allowance, and optional bags only from the yield or coverage stated by your product.',
  input: plasterQuantityInputV2,
  params: plasterQuantityParamsV2,
  output: plasterQuantityOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
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
    const a = areas(m);
    if (!a.ok) return a;
    const { gross, openings, net } = a.value;
    const thicknessM = mul(m.thickness, METRES_PER_UNIT[m.thicknessUnit]);
    const wet = mul(net, thicknessM);
    const order = withAllowance(wet, m.wastagePercent);
    const working: WorkingStep[] = [
      step('netArea', 'plaster2.netArea', { gross, openings, quantity: m.quantity }, net),
      step('wetVolume', 'plaster2.wetVolume', { net, thicknessM }, wet),
      step('orderVolume', 'plaster2.orderVolume', { wet, wastagePercent: m.wastagePercent }, order),
    ];
    const bags = m.bagVolumeM3
      ? ceilWhole(ratioWithAllowance(wet, m.bagVolumeM3, m.wastagePercent))
      : null;
    if (bags)
      working.push(step('bags', 'plaster2.bags', { bagVolumeM3: m.bagVolumeM3 ?? '' }, bags));
    return ok(
      {
        surfaceType: m.surfaceType,
        unit: m.unit,
        quantity: m.quantity,
        thickness: m.thickness,
        thicknessUnit: m.thicknessUnit,
        wastagePercent: m.wastagePercent,
        materialMode: m.materialMode,
        grossAreaM2: displayed(gross, m.displayDecimals, area),
        openingAreaM2: displayed(openings, m.displayDecimals, area),
        netAreaM2: displayed(net, m.displayDecimals, area),
        grossAreaFt2: displayed(toFt2(gross), m.displayDecimals, area),
        openingAreaFt2: displayed(toFt2(openings), m.displayDecimals, area),
        netAreaFt2: displayed(toFt2(net), m.displayDecimals, area),
        wetVolumeM3: displayed(wet, m.displayDecimals, volume),
        wetVolumeFt3: displayed(toFt3(wet), m.displayDecimals, amount),
        wetVolumeLitres: displayed(mul(wet, '1000'), m.displayDecimals, amount),
        orderVolumeM3: displayed(order, m.displayDecimals, volume),
        orderVolumeFt3: displayed(toFt3(order), m.displayDecimals, amount),
        orderVolumeLitres: displayed(mul(order, '1000'), m.displayDecimals, amount),
        ...(bags ? { bags } : {}),
        working,
      },
      notices(m),
    );
  },
});
