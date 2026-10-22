/**
 * Geometry for the CBM shipment illustration (#219). Pure functions only.
 *
 * The drawing is a FIXED decorative stack of 3 × 3 × 2 identical cartons on a pallet, shaped by one
 * package's length : width : height, and its arrows measure ONE carton. The arrangement never
 * depends on quantity, never checks fit or stacking, and never represents a container: it is
 * illustrative only. Floating point is used for drawing coordinates only.
 */
export const VIEWS = ['iso', 'top', 'front', 'side'] as const;
export type ViewKind = (typeof VIEWS)[number];
export type Tone =
  | 'top'
  | 'right'
  | 'left'
  | 'face'
  | 'palletTop'
  | 'palletSide'
  | 'palletGap'
  | 'tape';
export type Axis = 'length' | 'width' | 'height';

export interface Proportions {
  l: number;
  w: number;
  h: number;
}
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
/** `polygons` are in painter's order; a `tape` entry is a two-point stroke on the carton before it. */
export interface Scene {
  polygons: Polygon[];
  arrows: Arrow[];
}

export const VIEW_BOX = { width: 440, height: 280 } as const;
/** Cartons across the width (x), along the length (y) and high (z). */
const GRID = { x: 3, y: 3, z: 2 } as const;
const MARGIN_X = 62;
const MARGIN_Y = 24;
const MIN_RATIO = 0.18;
const C = Math.cos(Math.PI / 6);
const S = 0.5;

/** Relative carton proportions from one row's text inputs, or null when not drawable. */
export function proportions(length: string, width: string, height: string): Proportions | null {
  const values = [length, width, height].map((value) => Number(value.replace(/[\s,]/g, '')));
  if (!values.every((value) => Number.isFinite(value) && value > 0)) return null;
  const largest = Math.max(...values);
  const [l = 1, w = 1, h = 1] = values.map((value) => Math.max(MIN_RATIO, value / largest));
  return { l, w, h };
}

type P3 = [number, number, number];
type P2 = [number, number];
const iso = ([x, y, z]: P3): P2 => [(x - y) * C, (x + y) * S - z];

interface RawShape {
  polygons: { points: P2[]; tone: Tone }[];
  arrows: { axis: Axis; from: P2; to: P2; normal: P2 }[];
}

const quad = (...points: P3[]) => points;
function box(origin: P3, size: P3) {
  const [x0, y0, z0] = origin;
  const [x1, y1, z1] = [x0 + size[0], y0 + size[1], z0 + size[2]];
  return {
    top: quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]),
    right: quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]),
    left: quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]),
  };
}

function cartonsIso({ l, w, h }: Proportions): RawShape {
  const cells: P3[] = [];
  for (let i = 0; i < GRID.x; i++)
    for (let j = 0; j < GRID.y; j++) for (let k = 0; k < GRID.z; k++) cells.push([i, j, k]);
  cells.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const shape: RawShape = { polygons: [], arrows: [] };
  for (const [i, j, k] of cells) {
    const faces = box([i * w, j * l, k * h], [w, l, h]);
    for (const tone of ['top', 'right', 'left'] as const)
      shape.polygons.push({ points: faces[tone].map(iso), tone });
    const ym = (j + 0.5) * l;
    const zTop = (k + 1) * h;
    const tape: P3[] = [
      [i * w, ym, zTop],
      [(i + 1) * w, ym, zTop],
      [(i + 1) * w, ym, zTop - 0.3 * h],
    ];
    shape.polygons.push({ points: tape.map(iso), tone: 'tape' });
  }
  return shape;
}

function palletGaps(spanX: number, spanY: number, pad: number, deck: number) {
  const polygons: RawShape['polygons'] = [];
  const [xEnd, yEnd] = [spanX - pad, spanY - pad];
  for (const [a, b] of [
    [0.12, 0.3],
    [0.41, 0.59],
    [0.7, 0.88],
  ] as const) {
    const [zLow, zHigh] = [-deck, -deck * 0.45];
    const right: P3[] = [
      [xEnd, -pad + a * spanY, zLow],
      [xEnd, -pad + b * spanY, zLow],
      [xEnd, -pad + b * spanY, zHigh],
      [xEnd, -pad + a * spanY, zHigh],
    ];
    const left: P3[] = [
      [-pad + a * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zHigh],
      [-pad + a * spanX, yEnd, zHigh],
    ];
    polygons.push({ points: right.map(iso), tone: 'palletGap' });
    polygons.push({ points: left.map(iso), tone: 'palletGap' });
  }
  return polygons;
}

function palletIso({ l, w, h }: Proportions): RawShape {
  const pad = 0.05 * (l + w);
  const deck = 0.11 * (l + w);
  const [spanX, spanY] = [GRID.x * w + 2 * pad, GRID.y * l + 2 * pad];
  const slab = box([-pad, -pad, -deck], [spanX, spanY, deck]);
  const [xEnd, yEnd] = [GRID.x * w, GRID.y * l];
  return {
    polygons: [
      { points: slab.top.map(iso), tone: 'palletTop' },
      { points: slab.right.map(iso), tone: 'palletSide' },
      { points: slab.left.map(iso), tone: 'palletSide' },
      ...palletGaps(spanX, spanY, pad, deck),
    ],
    arrows: [
      {
        axis: 'width',
        from: iso([xEnd - w, yEnd + pad, -deck]),
        to: iso([xEnd, yEnd + pad, -deck]),
        normal: [-S, C],
      },
      {
        axis: 'length',
        from: iso([xEnd + pad, yEnd - l, -deck]),
        to: iso([xEnd + pad, yEnd, -deck]),
        normal: [S, C],
      },
      { axis: 'height', from: iso([0, yEnd, 0]), to: iso([0, yEnd, h]), normal: [-1, 0] },
    ],
  };
}

function rect(x: number, y: number, width: number, height: number): P2[] {
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
}

interface FlatSpec {
  across: number;
  up: number;
  columns: number;
  rows: number;
  axes: [Axis, Axis];
  fromAbove: boolean;
}

/** Orthographic view of the stack; arrows measure the last carton in the bottom row. */
function flat({ across, up, columns, rows, axes, fromAbove }: FlatSpec): RawShape {
  const shape: RawShape = { polygons: [], arrows: [] };
  const deck = fromAbove ? 0 : 0.11 * (across + up);
  const pad = 0.05 * (across + up);
  const [width, height] = [columns * across, rows * up];
  shape.polygons.push({
    points: fromAbove
      ? rect(-pad, -pad, width + 2 * pad, height + 2 * pad)
      : rect(-pad, height, width + 2 * pad, deck),
    tone: fromAbove ? 'palletTop' : 'palletSide',
  });
  for (let i = 0; i < columns; i++)
    for (let j = 0; j < rows; j++) {
      shape.polygons.push({ points: rect(i * across, j * up, across, up), tone: 'face' });
      const mid = (i + 0.5) * across;
      const tape: P2[] = fromAbove
        ? [
            [i * across, (j + 0.5) * up],
            [(i + 1) * across, (j + 0.5) * up],
          ]
        : [
            [mid, j * up],
            [mid, j * up + 0.3 * up],
          ];
      shape.polygons.push({ points: tape, tone: 'tape' });
    }
  const bottom = height + deck;
  shape.arrows.push(
    { axis: axes[0], from: [width - across, bottom], to: [width, bottom], normal: [0, 1] },
    { axis: axes[1], from: [width + pad, height], to: [width + pad, height - up], normal: [1, 0] },
  );
  return shape;
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
  const cartons = cartonsIso(p);
  return {
    polygons: [...pallet.polygons, ...cartons.polygons],
    arrows: pallet.arrows,
  };
}

const ARROW_GAP = 12;
const LABEL_GAP = 13;

/** The fitted scene for one view, in `VIEW_BOX` coordinates. */
export function scene(view: ViewKind, p: Proportions): Scene {
  const shape = raw(view, p);
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
    (VIEW_BOX.width - 2 * MARGIN_X) / (maxX - minX || 1),
    (VIEW_BOX.height - 2 * MARGIN_Y) / (maxY - minY || 1),
  );
  const offsetX = (VIEW_BOX.width - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (VIEW_BOX.height - (maxY - minY) * scale) / 2 - minY * scale;
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
      const [labelX, labelY] = shift(middle, LABEL_GAP);
      return { axis, ...segment(s, e), labelX, labelY };
    }),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;
const segment = ([x1, y1]: P2, [x2, y2]: P2): Segment => ({ x1, y1, x2, y2 });
