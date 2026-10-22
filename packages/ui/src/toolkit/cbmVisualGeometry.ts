/**
 * Geometry for the CBM shipment illustration (#219). Pure functions only.
 *
 * One package is drawn as a FIXED decorative stack of cartons on a pallet whose outer size follows
 * that package's length : width : height; the arrows measure that outer size. The arrangement
 * never depends on quantity, never checks fit or stacking, and never represents a container: it is
 * illustrative only. Floating point is used for drawing coordinates only.
 */
import {
  type Axis,
  cartonsIso,
  flat,
  GRID,
  type P2,
  type Proportions,
  palletIso,
  type RawShape,
  type Tone,
} from './cbmVisualShapes.ts';

export type { Axis, Proportions, Tone };
export const VIEWS = ['iso', 'top', 'front', 'side'] as const;
export type ViewKind = (typeof VIEWS)[number];

export interface Polygon {
  points: string;
  tone: Tone;
}
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface Arrow extends Segment {
  axis: Axis;
  labelX: number;
  labelY: number;
}
/** `polygons` are in painter's order; a `tape` entry is a stroke, not a filled shape. */
export interface Scene {
  polygons: Polygon[];
  arrows: Arrow[];
}

export const VIEW_BOX = { width: 520, height: 300 } as const;
/** Room for the dimension labels: beside the height arrow and below the two base arrows. */
const MARGIN = { x: 80, top: 2, bottom: 32 } as const;
const MIN_RATIO = 0.18;

/** Relative package proportions from one row's text inputs, or null when not drawable. */
export function proportions(length: string, width: string, height: string): Proportions | null {
  const values = [length, width, height].map((value) => Number(value.replace(/[\s,]/g, '')));
  if (!values.every((value) => Number.isFinite(value) && value > 0)) return null;
  const largest = Math.max(...values);
  const [l = 1, w = 1, h = 1] = values.map((value) => Math.max(MIN_RATIO, value / largest));
  return { l, w, h };
}

function raw(view: ViewKind, p: Proportions): RawShape {
  if (view === 'top')
    return flat({
      across: p.l,
      up: p.w,
      columns: GRID.y,
      rows: GRID.x,
      axes: ['length', 'width'],
      fromAbove: true,
    });
  if (view === 'front')
    return flat({
      across: p.l,
      up: p.h,
      columns: GRID.y,
      rows: GRID.z,
      axes: ['length', 'height'],
      fromAbove: false,
    });
  if (view === 'side')
    return flat({
      across: p.w,
      up: p.h,
      columns: GRID.x,
      rows: GRID.z,
      axes: ['width', 'height'],
      fromAbove: false,
    });
  const pallet = palletIso(p);
  return { polygons: [...pallet.polygons, ...cartonsIso(p).polygons], arrows: pallet.arrows };
}

const ARROW_GAP = 12;
/** Half a two-line label (about 56 × 34) measured along the normal, plus clearance. */
const labelGap = ([x, y]: P2) => Math.abs(x) * 28 + Math.abs(y) * 17 + 3;

/**
 * The fitted scene for one view, in `VIEW_BOX` coordinates. `labelScale` is the dimension labels'
 * size relative to the desktop drawing (phones draw them larger so they stay readable).
 */
export function scene(view: ViewKind, p: Proportions, labelScale = 1): Scene {
  const shape = raw(view, p);
  const bottom = MARGIN.bottom * labelScale;
  const all = shape.polygons.flatMap((polygon) => polygon.points);
  const xs = all.map(([x]) => x);
  const ys = all.map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const scale = Math.min(
    (VIEW_BOX.width - 2 * MARGIN.x) / (maxX - minX || 1),
    (VIEW_BOX.height - MARGIN.top - bottom) / (maxY - minY || 1),
  );
  const offsetX = (VIEW_BOX.width - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY =
    MARGIN.top + (VIEW_BOX.height - MARGIN.top - bottom - (maxY - minY) * scale) / 2 - minY * scale;
  const fit = ([x, y]: P2): P2 => [round(x * scale + offsetX), round(y * scale + offsetY)];
  return {
    polygons: shape.polygons.map(({ points, tone }) => ({
      tone,
      points: points.map((point) => fit(point).join(',')).join(' '),
    })),
    arrows: shape.arrows.map(({ axis, from, to, normal }) => {
      const [a, b] = [fit(from), fit(to)];
      const shift = (point: P2, gap: number): P2 => [
        round(point[0] + normal[0] * gap),
        round(point[1] + normal[1] * gap),
      ];
      const [s, e] = [shift(a, ARROW_GAP), shift(b, ARROW_GAP)];
      const middle: P2 = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
      const [labelX, labelY] = shift(middle, labelGap(normal) * labelScale);
      return { axis, ...segment(s, e), labelX, labelY };
    }),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;
const segment = ([x1, y1]: P2, [x2, y2]: P2): Segment => ({ x1, y1, x2, y2 });
