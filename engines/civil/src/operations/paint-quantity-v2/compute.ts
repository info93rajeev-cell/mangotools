import { ok, type Result } from '@mangotools/core';
import { add, div, mul, sub } from '@mangotools/engine-numeric';
import { checkDeductions, openingsArea } from '../../lib/openings.ts';
import { areaInM2, inMetres, ratioWithAllowance, withAllowance } from '../../lib/quantities.ts';
import { LITRES_PER_US_GALLON, SQUARE_METRES_PER_SQUARE_FOOT } from '../../lib/units-v2.ts';
import { cosineDegrees } from './cosine.ts';
import type { Measured, Surface } from './measure.ts';
import type { ContainerUnit } from './schema.ts';

export interface Computed {
  grossAreaM2: string;
  openingAreaM2: string;
  netAreaM2: string;
  coverageM2PerL: string;
  paintLitres: string;
  orderLitres: string;
  containers: string | null;
}

const LITRES_PER_CONTAINER_UNIT: Readonly<Record<ContainerUnit, string>> = {
  l: '1',
  gal: LITRES_PER_US_GALLON,
};

/** Gross paintable area of one room or surface, in m². */
export function surfaceAreaM2(s: Surface, unit: Measured['unit']): string {
  const m = (v: string) => inMetres(v, unit);
  if (s.kind === 'surface') return mul(m(s.length), m(s.secondDimension));
  if (s.kind === 'roof') {
    const planArea = mul(m(s.length), m(s.width));
    return div(planArea, cosineDegrees(s.pitchDegrees), 20);
  }
  const walls = mul(mul('2', add(m(s.length), m(s.width))), m(s.height));
  return s.ceiling ? add(walls, mul(m(s.length), m(s.width))) : walls;
}

/** Coverage in m² per litre, exact, whichever unit it was entered in. */
export function coverageM2PerL(m: Measured): string {
  if (m.coverageUnit === 'm2-per-l') return m.coverage;
  return div(mul(m.coverage, SQUARE_METRES_PER_SQUARE_FOOT), LITRES_PER_US_GALLON, 20);
}

/** Exact paint quantities: (net area × coats) ÷ coverage, then the wastage allowance. */
export function computePaint(m: Measured): Result<Computed> {
  const grossOne = surfaceAreaM2(m.surface, m.unit);
  const openingOne = areaInM2(openingsArea(m.openings), m.unit);
  const fits = checkDeductions(grossOne, openingOne);
  if (!fits.ok) return fits;
  const grossAreaM2 = mul(grossOne, m.quantity);
  const openingAreaM2 = mul(openingOne, m.quantity);
  const netAreaM2 = sub(grossAreaM2, openingAreaM2);
  const coverage = coverageM2PerL(m);
  const coated = mul(netAreaM2, m.coats);
  const paintLitres = div(coated, coverage, 20);
  const containers = m.container
    ? ratioWithAllowance(
        coated,
        mul(coverage, mul(m.container.size, LITRES_PER_CONTAINER_UNIT[m.container.unit])),
        m.wastagePercent,
      )
    : null;
  return ok({
    grossAreaM2,
    openingAreaM2,
    netAreaM2,
    coverageM2PerL: coverage,
    paintLitres,
    orderLitres: withAllowance(paintLitres, m.wastagePercent),
    containers,
  });
}
