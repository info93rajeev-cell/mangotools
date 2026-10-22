/**
 * Shapes for the CBM illustration (#219 reference): ONE package drawn as a fixed, decorative
 * 2 × 2 × 2 carton stack on a pallet. The stack's outer size follows the package's
 * length : width : height and the arrows measure that outer size, so the labels are the package's
 * own dimensions. Nothing here depends on quantity, fit or placement. Floating point is used for
 * drawing coordinates only.
 */
export type Tone =
  | 'top'
  | 'right'
  | 'left'
  | 'face'
  | 'palletTop'
  | 'palletSide'
  | 'palletGap'
  | 'tape'
  | 'label'
  | 'mark';
export type Axis = 'length' | 'width' | 'height';
export interface Proportions {
  l: number;
  w: number;
  h: number;
}
export type P3 = [number, number, number];
export type P2 = [number, number];
export interface RawShape {
  polygons: { points: P2[]; tone: Tone }[];
  arrows: { axis: Axis; from: P2; to: P2; normal: P2 }[];
}

export const GRID = { x: 2, y: 2, z: 2 } as const;
/**
 * The approved reference's viewpoint: turned about 36° and looking down about 20°, so the width
 * face is long and shallow and the length face short and steep. Heights are drawn at 0.7 so the
 * stack reads as in the reference; the drawing is illustrative, never to scale.
 */
const TURN = (36 * Math.PI) / 180;
const TILT = Math.sin((20 * Math.PI) / 180);
const X: P2 = [Math.cos(TURN), Math.sin(TURN) * TILT];
const Y: P2 = [-Math.sin(TURN), Math.cos(TURN) * TILT];
const Z = 0.7;
const iso = ([x, y, z]: P3): P2 => [x * X[0] + y * Y[0], x * X[1] + y * Y[1] - z * Z];
/** Unit normals pointing away from the drawing, beside the front-left and front-right edges. */
const unit = ([a, b]: P2): P2 => [a / Math.hypot(a, b), b / Math.hypot(a, b)];
const WIDTH_NORMAL: P2 = ((d) => [-d[1], d[0]] as P2)(unit(X));
const LENGTH_NORMAL: P2 = ((d) => [-d[1], d[0]] as P2)(unit([-Y[0], -Y[1]]));
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

/** Tape over the lid and a shipping label or handling marks on the faces that show. */
function details([x0, y0, z0]: P3, [cw, cl, ch]: P3, front: { left: boolean; right: boolean }) {
  const top = z0 + ch;
  const xm = x0 + cw / 2;
  const out: RawShape['polygons'] = [
    {
      points: [iso([xm, y0, top]), iso([xm, y0 + cl, top]), iso([xm, y0 + cl, top - 0.32 * ch])],
      tone: 'tape',
    },
  ];
  const y1 = y0 + cl;
  const x1 = x0 + cw;
  /** A patch on the width face (y = y1) or the length face (x = x1), as fractions of that face. */
  const patch = (face: 'left' | 'right', [a0, a1]: P2, [b0, b1]: P2, tone: Tone) => {
    const at = (a: number, b: number): P3 =>
      face === 'left' ? [x0 + a * cw, y1, z0 + b * ch] : [x1, y0 + a * cl, z0 + b * ch];
    out.push({ points: quad(at(a0, b0), at(a1, b0), at(a1, b1), at(a0, b1)).map(iso), tone });
  };
  if (front.left) {
    patch('left', [0.12, 0.3], [0.64, 0.8], 'mark');
    patch('left', [0.58, 0.86], [0.14, 0.34], 'label');
  }
  if (front.right) {
    patch('right', [0.16, 0.4], [0.62, 0.78], 'mark');
    patch('right', [0.52, 0.82], [0.14, 0.32], 'label');
  }
  return out;
}

export function cartonsIso({ l, w, h }: Proportions): RawShape {
  const size: P3 = [w / GRID.x, l / GRID.y, h / GRID.z];
  const cells: P3[] = [];
  for (let i = 0; i < GRID.x; i++)
    for (let j = 0; j < GRID.y; j++) for (let k = 0; k < GRID.z; k++) cells.push([i, j, k]);
  cells.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const polygons: RawShape['polygons'] = [];
  for (const [i, j, k] of cells) {
    const origin: P3 = [i * size[0], j * size[1], k * size[2]];
    const faces = box(origin, size);
    for (const tone of ['top', 'right', 'left'] as const)
      polygons.push({ points: faces[tone].map(iso), tone });
    polygons.push(...details(origin, size, { left: j === GRID.y - 1, right: i === GRID.x - 1 }));
  }
  return { polygons, arrows: [] };
}

function openings(spanX: number, spanY: number, pad: number, deck: number) {
  const polygons: RawShape['polygons'] = [];
  const [xEnd, yEnd, zLow, zHigh] = [spanX - pad, spanY - pad, -deck, -deck * 0.42];
  for (const [a, b] of [
    [0.13, 0.43],
    [0.57, 0.87],
  ] as const) {
    const right = quad(
      [xEnd, -pad + a * spanY, zLow],
      [xEnd, -pad + b * spanY, zLow],
      [xEnd, -pad + b * spanY, zHigh],
      [xEnd, -pad + a * spanY, zHigh],
    );
    const left = quad(
      [-pad + a * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zLow],
      [-pad + b * spanX, yEnd, zHigh],
      [-pad + a * spanX, yEnd, zHigh],
    );
    polygons.push({ points: right.map(iso), tone: 'palletGap' });
    polygons.push({ points: left.map(iso), tone: 'palletGap' });
  }
  return polygons;
}

/** Deck boards with gaps over the pallet base, block openings on the two visible sides. */
export function palletIso({ l, w, h }: Proportions): RawShape {
  const pad = 0.04 * (l + w);
  const deck = 0.1 * (l + w);
  const [spanX, spanY] = [w + 2 * pad, l + 2 * pad];
  const base = box([-pad, -pad, -deck], [spanX, spanY, deck]);
  const boards: RawShape['polygons'] = [];
  const count = 5;
  const step = spanY / count;
  for (let n = 0; n < count; n++) {
    const y0 = -pad + n * step + step * 0.08;
    boards.push({
      points: box([-pad, y0, -0.001], [spanX, step * 0.84, 0.001]).top.map(iso),
      tone: 'palletTop',
    });
  }
  return {
    polygons: [
      { points: base.top.map(iso), tone: 'palletGap' },
      { points: base.right.map(iso), tone: 'palletSide' },
      { points: base.left.map(iso), tone: 'palletSide' },
      ...boards,
      ...openings(spanX, spanY, pad, deck),
    ],
    arrows: [
      {
        axis: 'width',
        from: iso([-pad, l + pad, -deck]),
        to: iso([w + pad, l + pad, -deck]),
        normal: WIDTH_NORMAL,
      },
      {
        axis: 'length',
        from: iso([w + pad, -pad, -deck]),
        to: iso([w + pad, l + pad, -deck]),
        normal: LENGTH_NORMAL,
      },
      { axis: 'height', from: iso([0, l, 0]), to: iso([0, l, h]), normal: [-1, 0] },
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

export interface FlatSpec {
  across: number;
  up: number;
  columns: number;
  rows: number;
  axes: [Axis, Axis];
  fromAbove: boolean;
}

/** Orthographic view of the same stack; the arrows measure its outer size. */
export function flat({ across, up, columns, rows, axes, fromAbove }: FlatSpec): RawShape {
  const shape: RawShape = { polygons: [], arrows: [] };
  const deck = fromAbove ? 0 : 0.1 * (across + up);
  const pad = 0.04 * (across + up);
  const [cellX, cellY] = [across / columns, up / rows];
  shape.polygons.push({
    points: fromAbove
      ? rect(-pad, -pad, across + 2 * pad, up + 2 * pad)
      : rect(-pad, up, across + 2 * pad, deck),
    tone: fromAbove ? 'palletTop' : 'palletSide',
  });
  for (let i = 0; i < columns; i++)
    for (let j = 0; j < rows; j++) {
      shape.polygons.push({ points: rect(i * cellX, j * cellY, cellX, cellY), tone: 'face' });
      const mid = (i + 0.5) * cellX;
      const tape: P2[] = fromAbove
        ? [
            [i * cellX, (j + 0.5) * cellY],
            [(i + 1) * cellX, (j + 0.5) * cellY],
          ]
        : [
            [mid, j * cellY],
            [mid, j * cellY + 0.3 * cellY],
          ];
      shape.polygons.push({ points: tape, tone: 'tape' });
    }
  shape.arrows.push(
    { axis: axes[0], from: [0, up + deck], to: [across, up + deck], normal: [0, 1] },
    { axis: axes[1], from: [across + pad, up], to: [across + pad, 0], normal: [1, 0] },
  );
  return shape;
}
