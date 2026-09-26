import { compare, div, mul, sub } from '@mangotools/engine-numeric';

export type Dim = 'length' | 'width' | 'height';
export type OrientationKey = 'lwh' | 'lhw' | 'wlh' | 'whl' | 'hlw' | 'hwl';

/**
 * All 6 axis-aligned orientations: which carton dimension is placed along a box's length, width and
 * height axis (in that order). A simple, single-orientation grid, not a packing solver. Shared by
 * `container-fit` (a container's three fixed axes) and `pallet-fit` (a pallet's length, width and
 * stack-height limit) — the search is the same math either way.
 */
export const ORIENTATIONS: Readonly<Record<OrientationKey, readonly [Dim, Dim, Dim]>> = {
  lwh: ['length', 'width', 'height'],
  lhw: ['length', 'height', 'width'],
  wlh: ['width', 'length', 'height'],
  whl: ['width', 'height', 'length'],
  hlw: ['height', 'length', 'width'],
  hwl: ['height', 'width', 'length'],
};

/** Orientations where the carton's own height stays on the box's height (vertical) axis. */
const UPRIGHT_ORIENTATIONS: readonly OrientationKey[] = ['lwh', 'wlh'];

/** Whole cartons that fit along one axis: floor(axisLength / cartonLength). Both are positive. */
export function floorCount(axisLength: string, cartonLength: string): string {
  const quotient = div(axisLength, cartonLength, 20);
  const [whole] = quotient.split('.');
  return whole ?? '0';
}

export interface OrientationResult {
  key: OrientationKey;
  counts: readonly [string, string, string];
  total: string;
}

/** Which orientations to try, per the rotation options. Always at least one. */
export function orientationsToTry(allowRotation: boolean, keepUpright: boolean): OrientationKey[] {
  if (!allowRotation) return ['lwh'];
  return keepUpright ? [...UPRIGHT_ORIENTATIONS] : (Object.keys(ORIENTATIONS) as OrientationKey[]);
}

/** Counts for one orientation. The height-axis count is capped to 1 when cartons cannot stack. */
function evaluateOrientation(
  box: readonly [string, string, string],
  carton: Record<Dim, string>,
  key: OrientationKey,
  stackable: boolean,
): OrientationResult {
  const order = ORIENTATIONS[key];
  const raw = order.map((dim, axis) => floorCount(box[axis], carton[dim]));
  const heightCount = !stackable && compare(raw[2] ?? '0', '1') > 0 ? '1' : (raw[2] ?? '0');
  const counts: [string, string, string] = [raw[0] ?? '0', raw[1] ?? '0', heightCount];
  const total = mul(mul(counts[0], counts[1]), counts[2]);
  return { key, counts, total };
}

/** The orientation with the most cartons among the ones tried; ties keep the first one tried. */
export function bestOrientation(
  box: readonly [string, string, string],
  carton: Record<Dim, string>,
  allowRotation: boolean,
  keepUpright: boolean,
  stackable: boolean,
): OrientationResult {
  const keys = orientationsToTry(allowRotation, keepUpright);
  const [first, ...rest] = keys;
  let best = evaluateOrientation(box, carton, first as OrientationKey, stackable);
  for (const key of rest) {
    const candidate = evaluateOrientation(box, carton, key, stackable);
    if (compare(candidate.total, best.total) > 0) best = candidate;
  }
  return best;
}

/** Leftover space (box axis minus cartons × carton dimension) for the winning orientation. */
export function leftovers(
  box: readonly [string, string, string],
  carton: Record<Dim, string>,
  result: OrientationResult,
): readonly [string, string, string] {
  const order = ORIENTATIONS[result.key];
  const values = order.map((dim, axis) => sub(box[axis], mul(result.counts[axis], carton[dim])));
  return [values[0] ?? '0', values[1] ?? '0', values[2] ?? '0'];
}
