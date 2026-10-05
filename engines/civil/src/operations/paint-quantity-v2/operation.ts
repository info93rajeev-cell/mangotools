import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { div, toFixedString } from '@mangotools/engine-numeric';
import { assumption, info, wastageAssumption } from '../../lib/notices.ts';
import { amount, area, ceilWhole } from '../../lib/present.ts';
import { anyUnrealistic, toFt2 } from '../../lib/quantities.ts';
import { LITRES_PER_US_GALLON } from '../../lib/units-v2.ts';
import { step } from '../../lib/working.ts';
import { type Computed, computePaint } from './compute.ts';
import { type Measured, measure, type Surface } from './measure.ts';
import { paintQuantityInputV2, paintQuantityOutputV2, paintQuantityParamsV2 } from './schema.ts';

const COVERAGE_LABEL = { 'm2-per-l': 'm²/L', 'ft2-per-gal': 'ft²/US gal' } as const;
const CONTAINER_LABEL = { l: 'L', gal: 'US gal' } as const;

const dimensionsOf = (s: Surface) =>
  s.kind === 'room'
    ? [s.length, s.width, s.height]
    : [s.length, s.kind === 'roof' ? s.width : s.secondDimension];

function notices(m: Measured): OpWarning[] {
  const list = [
    assumption('CIVIL_ASSUMPTION_COVERAGE', {
      coverage: m.coverage,
      unit: COVERAGE_LABEL[m.coverageUnit],
    }),
    wastageAssumption(m.wastagePercent),
  ];
  if (m.container) {
    const unit = CONTAINER_LABEL[m.container.unit];
    list.push(assumption('CIVIL_ASSUMPTION_CONTAINER', { size: m.container.size, unit }));
  }
  list.push(
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_PAINT_BEFORE_APPLICATION'),
    info('CIVIL_PAINT_CONDITIONS_VARY'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_PAINTER'),
    info('CIVIL_PAINT_SCOPE_LIMIT_V2'),
  );
  if (anyUnrealistic(dimensionsOf(m.surface), m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function working(m: Measured, c: Computed, containers: string | null): WorkingStep[] {
  const steps = [
    step(
      'grossArea',
      `paint2.grossArea.${m.surface.kind}`,
      { quantity: m.quantity },
      c.grossAreaM2,
    ),
    step(
      'netArea',
      'paint2.netArea',
      { gross: c.grossAreaM2, openings: c.openingAreaM2 },
      c.netAreaM2,
    ),
    step(
      'paintLitres',
      'paint2.paintLitres',
      { net: c.netAreaM2, coats: m.coats, coverage: c.coverageM2PerL },
      c.paintLitres,
    ),
    step(
      'orderLitres',
      'paint2.orderLitres',
      { litres: c.paintLitres, wastagePercent: m.wastagePercent },
      c.orderLitres,
    ),
  ];
  if (containers) steps.push(step('containers', 'paint2.containers', {}, containers));
  return steps;
}

const shown = (value: string, decimals: number | null, legacy: (raw: string) => string) =>
  decimals === null ? legacy(value) : toFixedString(value, decimals, 'half-up');

const gallons = (litres: string, decimals: number | null) =>
  shown(div(litres, LITRES_PER_US_GALLON, 20), decimals, amount);

export const paintQuantityV2 = defineOperation({
  id: 'civil.paint.quantity',
  major: 2,
  title: 'Paint quantity (room, surface or roof, with repeatable openings)',
  summary:
    'Paint litres/gallons from room, surface or pitched-roof dimensions, repeatable openings, explicit coats, an editable coverage rate and wastage, with optional whole containers of a size you choose.',
  input: paintQuantityInputV2,
  params: paintQuantityParamsV2,
  output: paintQuantityOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_COATS_NOT_POSITIVE',
    'CIVIL_COATS_NOT_WHOLE',
    'CIVIL_COATS_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
    'CIVIL_PAINT_PITCH_OUT_OF_RANGE',
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
    const computed = computePaint(m);
    if (!computed.ok) return computed;
    const c = computed.value;
    const decimals = m.displayDecimals;
    const containers = c.containers === null ? null : ceilWhole(c.containers);
    const containerOutputs =
      m.container && containers
        ? { containerSize: m.container.size, containerUnit: m.container.unit, containers }
        : {};
    return ok(
      {
        mode: input.mode,
        unit: m.unit,
        quantity: m.quantity,
        coats: m.coats,
        coverage: m.coverage,
        coverageUnit: m.coverageUnit,
        wastagePercent: m.wastagePercent,
        grossAreaM2: shown(c.grossAreaM2, decimals, area),
        openingAreaM2: shown(c.openingAreaM2, decimals, area),
        netAreaM2: shown(c.netAreaM2, decimals, area),
        grossAreaFt2: shown(toFt2(c.grossAreaM2), decimals, area),
        openingAreaFt2: shown(toFt2(c.openingAreaM2), decimals, area),
        netAreaFt2: shown(toFt2(c.netAreaM2), decimals, area),
        paintLitres: shown(c.paintLitres, decimals, amount),
        paintGallons: gallons(c.paintLitres, decimals),
        orderLitres: shown(c.orderLitres, decimals, amount),
        orderGallons: gallons(c.orderLitres, decimals),
        ...containerOutputs,
        working: working(m, c, containers),
      },
      notices(m),
    );
  },
});
