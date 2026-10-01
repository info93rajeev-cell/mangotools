import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { div, mul, sub } from '@mangotools/engine-numeric';
import { assumption, info, wastageAssumption } from '../../lib/notices.ts';
import { checkDeductions, openingsArea } from '../../lib/openings.ts';
import { area, calculated, ceilWhole } from '../../lib/present.ts';
import {
  anyUnrealistic,
  areaInM2,
  inMetres,
  ratioWithAllowance,
  toFt2,
} from '../../lib/quantities.ts';
import { step } from '../../lib/working.ts';
import { type Measured, measure } from './measure.ts';
import { tileQuantityInputV2, tileQuantityOutputV2, tileQuantityParamsV2 } from './schema.ts';

function notices(m: Measured): OpWarning[] {
  const list = [assumption('CIVIL_ASSUMPTION_TILE_FACE'), wastageAssumption(m.wastagePercent)];
  list.push(
    info('CIVIL_ESTIMATION_AID_ONLY'),
    info('CIVIL_VERIFY_TILE_BEFORE_INSTALLATION'),
    info('CIVIL_TILE_CONDITIONS_VARY'),
    info('CIVIL_NOT_PROFESSIONAL_REPLACEMENT_CONTRACTOR'),
    info('CIVIL_TILE_SCOPE_LIMIT_V2'),
  );
  const dims = m.surface.kind === 'dimensions' ? [m.surface.length, m.surface.width] : [];
  if (anyUnrealistic(dims, m.unit)) {
    list.push(warning('CIVIL_DIMENSION_UNREALISTIC', { details: { max: '100' } }));
  }
  return list;
}

function grossOneM2(m: Measured): string {
  const s = m.surface;
  if (s.kind === 'area') return areaInM2(s.area, m.unit);
  return mul(inMetres(s.length, m.unit), inMetres(s.width, m.unit));
}

function boxesFor(m: Measured, net: string, orderTiles: string, working: WorkingStep[]) {
  const p = m.packing;
  if (p.kind === 'none') return {};
  const boxes =
    p.kind === 'pieces'
      ? ceilWhole(div(orderTiles, p.tilesPerBox, 20))
      : ceilWhole(ratioWithAllowance(net, p.coverageM2, m.wastagePercent));
  working.push(step('boxes', `tile2.boxes.${p.kind}`, { orderTiles }, boxes));
  return { boxes };
}

export const tileQuantityV2 = defineOperation({
  id: 'civil.tile.quantity',
  major: 2,
  title: 'Tile / flooring quantity (pieces and boxes)',
  summary:
    'Tile pieces to buy from net surface area (dimensions or direct area, after repeatable deductions) ÷ tile face area, plus an editable wastage allowance, with boxes from pieces or coverage per box.',
  input: tileQuantityInputV2,
  params: tileQuantityParamsV2,
  output: tileQuantityOutputV2,
  errors: [
    'CIVIL_MISSING_INPUT',
    'CIVIL_INVALID_NUMBER',
    'CIVIL_TOO_MANY_DECIMALS',
    'CIVIL_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_POSITIVE',
    'CIVIL_QUANTITY_NOT_WHOLE',
    'CIVIL_QUANTITY_TOO_LARGE',
    'CIVIL_WASTAGE_OUT_OF_RANGE',
    'CIVIL_TILES_PER_BOX_NOT_POSITIVE',
    'CIVIL_TILES_PER_BOX_NOT_WHOLE',
    'CIVIL_TILES_PER_BOX_TOO_LARGE',
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
    const grossOne = grossOneM2(m);
    const openingOne = areaInM2(openingsArea(m.openings), m.unit);
    const fits = checkDeductions(grossOne, openingOne);
    if (!fits.ok) return fits;
    const gross = mul(grossOne, m.quantity);
    const openings = mul(openingOne, m.quantity);
    const net = sub(gross, openings);
    const tile = mul(inMetres(m.tileLength, m.tileUnit), inMetres(m.tileWidth, m.tileUnit));
    const base = div(net, tile, 20);
    const adjusted = ratioWithAllowance(net, tile, m.wastagePercent);
    const orderTiles = ceilWhole(adjusted);
    const working: WorkingStep[] = [
      step('netArea', 'tile2.netArea', { gross, openings, quantity: m.quantity }, net),
      step('baseTiles', 'tile2.baseTiles', { net, tile }, base),
      step(
        'orderTiles',
        'tile2.orderTiles',
        { base, wastagePercent: m.wastagePercent, adjusted },
        orderTiles,
      ),
    ];
    const boxes = boxesFor(m, net, orderTiles, working);
    return ok(
      {
        unit: m.unit,
        tileUnit: m.tileUnit,
        quantity: m.quantity,
        wastagePercent: m.wastagePercent,
        packMode: input.packMode,
        grossAreaM2: area(gross),
        openingAreaM2: area(openings),
        netAreaM2: area(net),
        grossAreaFt2: area(toFt2(gross)),
        openingAreaFt2: area(toFt2(openings)),
        netAreaFt2: area(toFt2(net)),
        baseTiles: calculated(base),
        wastageTiles: calculated(sub(adjusted, base)),
        orderTiles,
        ...boxes,
        working,
      },
      notices(m),
    );
  },
});
