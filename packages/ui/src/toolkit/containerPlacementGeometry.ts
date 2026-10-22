import type { LoadResult, PlacementBlock } from './containerWorkspaceModel.ts';
export type LoadView = 'iso' | 'top' | 'front' | 'side';
type Point = readonly [number, number, number];
export const packageColors = ['#2563eb', '#22b573', '#f59e42', '#8b5cf6', '#d946ef', '#0891b2'];
export function projector(result: LoadResult, view: LoadView) {
  const l = Number(result.containerLength),
    w = Number(result.containerWidth),
    h = Number(result.containerHeight);
  return ([x, y, z]: Point): string => {
    const a = x / l,
      b = y / w,
      c = z / h;
    if (view === 'top') return `${60 + a * 650},${45 + b * 210}`;
    if (view === 'front') return `${230 + b * 340},${255 - c * 210}`;
    if (view === 'side') return `${60 + a * 650},${255 - c * 210}`;
    return `${90 + a * 600 + b * 20},${270 - b * 20 - c * 235}`;
  };
}
export function boxFaces(block: PlacementBlock, project: (p: Point) => string) {
  const x = Number(block.x),
    y = Number(block.y),
    z = Number(block.z);
  const l = Number(block.pieceLength) * block.countX,
    w = Number(block.pieceWidth) * block.countY,
    h = Number(block.pieceHeight) * block.countZ;
  const point = (a: number, b: number, c: number) => project([x + a, y + b, z + c]);
  return [
    [point(0, 0, 0), point(l, 0, 0), point(l, 0, h), point(0, 0, h)],
    [point(l, 0, 0), point(l, w, 0), point(l, w, h), point(l, 0, h)],
    [point(0, 0, h), point(l, 0, h), point(l, w, h), point(0, w, h)],
  ].map((points) => points.join(' '));
}
export function containerLines(result: LoadResult, project: (p: Point) => string) {
  const l = Number(result.containerLength),
    w = Number(result.containerWidth),
    h = Number(result.containerHeight);
  const points: Point[] = [
    [0, 0, 0],
    [l, 0, 0],
    [l, w, 0],
    [0, w, 0],
    [0, 0, h],
    [l, 0, h],
    [l, w, h],
    [0, w, h],
  ];
  return [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ].map(
    ([a, b]) => `${project(points[a ?? 0] ?? [0, 0, 0])} ${project(points[b ?? 0] ?? [0, 0, 0])}`,
  );
}

/** Bounded viewer expansion of the engine's exact grid assignment; never used for fit or totals. */
export function visiblePieces(blocks: PlacementBlock[], limit = 250) {
  const pieces: PlacementBlock[] = [];
  for (const block of blocks) {
    for (let index = 0; index < block.count && pieces.length < limit; index++) {
      const x = index % block.countX;
      const y = Math.floor(index / block.countX) % block.countY;
      const z = Math.floor(index / (block.countX * block.countY));
      pieces.push({
        ...block,
        x: String(Number(block.x) + x * Number(block.pieceLength)),
        y: String(Number(block.y) + y * Number(block.pieceWidth)),
        z: String(Number(block.z) + z * Number(block.pieceHeight)),
        countX: 1,
        countY: 1,
        countZ: 1,
        count: 1,
      });
    }
    if (pieces.length >= limit) break;
  }
  return pieces;
}
