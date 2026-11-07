/**
 * Pen-tool editing steps that work like a desktop pen tool: the path stays open while you
 * place points, and only a closed path (click the first point, press C, or Close Path)
 * becomes part of the selection.
 */
import type { BezierPath, BezierPoint } from './bezierPathModel.ts';

let seq = 0;

export function cornerPoint(x: number, y: number): BezierPoint {
  seq += 1;
  const rx = Math.round(x);
  const ry = Math.round(y);
  return {
    id: `pt_${seq}_${rx}_${ry}`,
    x: rx,
    y: ry,
    cp1x: rx,
    cp1y: ry,
    cp2x: rx,
    cp2y: ry,
    isSmooth: false,
  };
}

/** Adds a point to the end of an open path. A closed path is left unchanged. */
export function appendOpenPoint(path: BezierPath, x: number, y: number): BezierPath {
  if (path.isClosed) return path;
  return { points: [...path.points, cornerPoint(x, y)], isClosed: false };
}

/** Closes the path when it has at least three points. */
export function closePath(path: BezierPath): BezierPath {
  if (path.isClosed || path.points.length < 3) return path;
  return { ...path, isClosed: true };
}

export function canClosePath(path: BezierPath): boolean {
  return !path.isClosed && path.points.length >= 3;
}

/** True when (x, y) is within `tolerance` image pixels of the path's first point. */
export function isOnFirstPoint(path: BezierPath, x: number, y: number, tolerance: number) {
  const first = path.points[0];
  if (!first) return false;
  return Math.hypot(first.x - x, first.y - y) <= tolerance;
}

function updatePoint(path: BezierPath, idx: number, fn: (p: BezierPoint) => BezierPoint) {
  return { ...path, points: path.points.map((p, i) => (i === idx ? fn(p) : p)) };
}

/**
 * Drag-out while placing a point: the outgoing handle follows the pointer and the incoming
 * handle mirrors it, which makes a smooth curve through the point.
 */
export function pullHandles(path: BezierPath, idx: number, x: number, y: number): BezierPath {
  return updatePoint(path, idx, (p) => ({
    ...p,
    cp2x: x,
    cp2y: y,
    cp1x: 2 * p.x - x,
    cp1y: 2 * p.y - y,
    isSmooth: true,
  }));
}

function hasHandles(p: BezierPoint): boolean {
  return p.cp1x !== p.x || p.cp1y !== p.y || p.cp2x !== p.x || p.cp2y !== p.y;
}

function neighbours(path: BezierPath, idx: number) {
  const n = path.points.length;
  const wrap = path.isClosed;
  const prev = idx > 0 ? path.points[idx - 1] : wrap ? path.points[n - 1] : undefined;
  const next = idx < n - 1 ? path.points[idx + 1] : wrap ? path.points[0] : undefined;
  return { prev, next };
}

/**
 * Curve point ⇄ corner point. A corner gets handles along the line from its previous to its
 * next neighbour (one third of the neighbour distance), a curve point loses its handles.
 */
export function toggleCurvePoint(path: BezierPath, idx: number): BezierPath {
  const p = path.points[idx];
  if (!p) return path;
  if (hasHandles(p)) {
    return updatePoint(path, idx, (q) => ({
      ...q,
      cp1x: q.x,
      cp1y: q.y,
      cp2x: q.x,
      cp2y: q.y,
      isSmooth: false,
    }));
  }
  const { prev, next } = neighbours(path, idx);
  const a = prev ?? p;
  const b = next ?? p;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return path;
  const reach = len / 6;
  const ux = (dx / len) * reach;
  const uy = (dy / len) * reach;
  return updatePoint(path, idx, (q) => ({
    ...q,
    cp1x: q.x - ux,
    cp1y: q.y - uy,
    cp2x: q.x + ux,
    cp2y: q.y + uy,
    isSmooth: true,
  }));
}
