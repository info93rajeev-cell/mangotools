/**
 * Geometry for the CBM shipment illustration (#219, Workstream B). Pure functions only.
 *
 * The drawing is a FIXED decorative group of 2 × 2 × 2 identical cartons on a pallet, shaped by one
 * package's length : width : height. The arrangement never depends on quantity, never checks fit or
 * stacking, and never represents a container: it is illustrative only. Floating point is used for
 * drawing coordinates only; no calculated figure comes from here.
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

export const VIEW_BOX = { width: 400, height: 210 } as const;
const GRID = 2;
const MARGIN_X = 56;
const MARGIN_Y = 26;
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

function box(origin: P3, size: P3) {
  const [x0, y0, z0] = origin;
  const [x1, y1, z1] = [x0 + size[0], y0 + size[1], z0 + size[2]];
  return {
    top: [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ] as P3[],
    right: [
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
    ] as P3[],
    left: [
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ] as P3[],
  };
}

function cartonsIso({ l, w, h }: Proportions): RawShape {
  const cells: P3[] = [];
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++) for (let k = 0; k < GRID; k++) cells.push([i, j, k]);
  cells.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const shape: RawShape = { polygons: [], arrows: [] };
  for (const [i, j, k] of cells) {
    const faces = box([i * l, j * w, k * h], [l, w, h]);
    for (const tone of ['top', 'right', 'left'] as const)
      shape.polygons.push({ points: faces[tone].map(iso), tone });
    const ym = (j + 0.5) * w;
    const zTop = (k + 1) * h;
    const tape: P3[] = [
      [i * l, ym, zTop],
      [(i + 1) * l, ym, zTop],
      [(i + 1) * l, ym, zTop - 0.3 * h],
    ];
    shape.polygons.push({ points: tape.map(iso), tone: 'tape' });
  }
  return shape;
}

function palletIso({ l, w, h }: Proportions): RawShape {
  const pad = 0.05 * (l + w);
  const deck = 0.11 * (l + w);
  const slab = box([-pad, -pad, -deck], [GRID * l + 2 * pad, GRID * w + 2 * pad, deck]);
  const polygons: RawShape['polygons'] = [
    { points: slab.top.map(iso), tone: 'palletTop' },
    { points: slab.right.map(iso), tone: 'palletSide' },
    { points: slab.left.map(iso), tone: 'palletSide' },
  ];
  const xEnd = GRID * l + pad;
  const yEnd = GRID * w + pad;
  for (const [a, b] of [
    [0.2, 0.42],
    [0.58, 0.8],
  ] as const) {
    const spanY = GRID * w + 2 * pad;
    const spanX = GRID * l + 2 * pad;
    const zLow = -deck;
    const zHigh = -deck * 0.45;
    const gapRight: P3[] = [
      [xEnd, -pad + a * spanY, zLow],
      [xEnd, -pad + b * spanY, zLow],
      [xEnd, -pad + b * spanY, zHigh],
      [xEnd, -pad + a * spanY, zHigh],
    ];
    const gapLeft: P3[] = [
      [-pad + a * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zHigh],
      [-pad + a * spanX, yEnd, zHigh],
    ];
    polygons.push({ points: gapRight.map(iso), tone: 'palletGap' });
    polygons.push({ points: gapLeft.map(iso), tone: 'palletGap' });
  }
  const below = -deck;
  return {
    polygons,
    arrows: [
      {
        axis: 'length',
        from: iso([l, yEnd, below]),
        to: iso([2 * l, yEnd, below]),
        normal: [-S, C],
      },
      { axis: 'width', from: iso([xEnd, w, below]), to: iso([xEnd, 2 * w, below]), normal: [S, C] },
      { axis: 'height', from: iso([2 * l, 0, 0]), to: iso([2 * l, 0, h]), normal: [1, 0] },
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

/** Orthographic view: `across` is the horizontal size and `up` the vertical size of one carton. */
function flat(across: number, up: number, axes: [Axis, Axis], fromAbove: boolean): RawShape {
  const shape: RawShape = { polygons: [], arrows: [] };
  const deck = fromAbove ? 0 : 0.11 * (across + up);
  const pad = 0.05 * (across + up);
  if (fromAbove) {
    shape.polygons.push({
      points: rect(-pad, -pad, GRID * across + 2 * pad, GRID * up + 2 * pad),
      tone: 'palletTop',
    });
  } else {
    shape.polygons.push({
      points: rect(-pad, GRID * up, GRID * across + 2 * pad, deck),
      tone: 'palletSide',
    });
  }
  for (let i = 0; i < GRID; i++)
    for (let j = 0; j < GRID; j++) {
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
  const bottom = GRID * up + deck;
  shape.arrows.push({
    axis: axes[0],
    from: [across, bottom],
    to: [GRID * across, bottom],
    normal: [0, 1],
  });
  shape.arrows.push({
    axis: axes[1],
    from: [GRID * across + pad, fromAbove ? up : GRID * up],
    to: [GRID * across + pad, fromAbove ? 0 : up],
    normal: [1, 0],
  });
  return shape;
}

function raw(view: ViewKind, p: Proportions): RawShape {
  if (view === 'top') return flat(p.l, p.w, ['length', 'width'], true);
  if (view === 'front') return flat(p.l, p.h, ['length', 'height'], false);
  if (view === 'side') return flat(p.w, p.h, ['width', 'height'], false);
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

/** 24 × 24 outline glyphs for the result cards, drawn in the same carton language. */
export const GLYPHS = {
  pieces:
    'M4 9.5 9 7l5 2.5L9 12Z M4 9.5V15l5 2.5V12 M14 9.5V15l-5 2.5 M10 14.5l5-2.5 5 2.5-5 2.5Z M10 14.5V19l5 2.5V17 M20 14.5V19l-5 2.5',
  volume: 'M12 3 20 7.5 12 12 4 7.5Z M4 7.5v9L12 21v-9 M20 7.5v9L12 21',
  weight: 'M9.5 8a2.5 2.5 0 1 1 5 0 M7 8h10l2.5 12h-15Z',
  average: 'M12 5 18 8.5 12 12 6 8.5Z M6 8.5v6.5l6 3.5v-6.5 M18 8.5V15l-6 3.5 M3 21h18',
} as const;
export type GlyphName = keyof typeof GLYPHS;
