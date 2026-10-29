/**
 * Bezier Path Data Model and Geometry Operations
 * Pure mathematical representation of closed 2D cubic Bezier spline paths.
 */

export interface BezierPoint {
  id: string;
  x: number;
  y: number;
  cp1x: number; // Incoming control point (from previous anchor)
  cp1y: number;
  cp2x: number; // Outgoing control point (toward next anchor)
  cp2y: number;
  isSmooth: boolean;
}

export interface BezierPath {
  points: BezierPoint[];
  isClosed: boolean;
}

/** Distance between two 2D points */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Cubic Bezier point computation for t in [0, 1] */
export function cubicBezierPoint(
  p0: { x: number; y: number },
  cp1: { x: number; y: number },
  cp2: { x: number; y: number },
  p1: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * cp1.x + 3 * u * tt * cp2.x + ttt * p1.x,
    y: uuu * p0.y + 3 * uu * t * cp1.y + 3 * u * tt * cp2.y + ttt * p1.y,
  };
}

/** Finds closest point on path for inserting new nodes */
export function findClosestSegment(
  path: BezierPath,
  qx: number,
  qy: number,
): { segmentIndex: number; t: number; distance: number } | null {
  if (path.points.length < 2) return null;
  const count = path.isClosed ? path.points.length : path.points.length - 1;
  let bestDist = Number.POSITIVE_INFINITY;
  let bestSeg = 0;
  let bestT = 0.5;

  for (let i = 0; i < count; i++) {
    const p0 = path.points[i];
    const p1 = path.points[(i + 1) % path.points.length];
    // Sample 10 steps along the curve segment
    for (let s = 1; s <= 9; s++) {
      const t = s / 10;
      const pt = cubicBezierPoint(
        { x: p0.x, y: p0.y },
        { x: p0.cp2x, y: p0.cp2y },
        { x: p1.cp1x, y: p1.cp1y },
        { x: p1.x, y: p1.y },
        t,
      );
      const d = distance(qx, qy, pt.x, pt.y);
      if (d < bestDist) {
        bestDist = d;
        bestSeg = i;
        bestT = t;
      }
    }
  }

  return { segmentIndex: bestSeg, t: bestT, distance: bestDist };
}

/** Inserts a new point along segment */
export function insertPointAt(path: BezierPath, segIndex: number, t: number): BezierPath {
  const p0 = path.points[segIndex];
  const p1 = path.points[(segIndex + 1) % path.points.length];
  const pt = cubicBezierPoint(
    { x: p0.x, y: p0.y },
    { x: p0.cp2x, y: p0.cp2y },
    { x: p1.cp1x, y: p1.cp1y },
    { x: p1.x, y: p1.y },
    t,
  );

  const newPt: BezierPoint = {
    id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: Math.round(pt.x),
    y: Math.round(pt.y),
    cp1x: Math.round(pt.x - 12),
    cp1y: Math.round(pt.y),
    cp2x: Math.round(pt.x + 12),
    cp2y: Math.round(pt.y),
    isSmooth: true,
  };

  const newPoints = [...path.points];
  newPoints.splice(segIndex + 1, 0, newPt);
  return { ...path, points: newPoints };
}

/** Deletes point by ID */
export function deletePointById(path: BezierPath, pointId: string): BezierPath {
  if (path.points.length <= 3) return path; // Minimum 3 points for a closed polygon
  return {
    ...path,
    points: path.points.filter((p) => p.id !== pointId),
  };
}

/** Moves anchor and keeps control handles in relative offset */
export function movePointCoords(
  path: BezierPath,
  target: string | number,
  newX: number,
  newY: number,
): BezierPath {
  return {
    ...path,
    points: path.points.map((p, idx) => {
      const match = typeof target === 'number' ? idx === target : p.id === target;
      if (!match) return p;
      const dx = newX - p.x;
      const dy = newY - p.y;
      return {
        ...p,
        x: newX,
        y: newY,
        cp1x: p.cp1x + dx,
        cp1y: p.cp1y + dy,
        cp2x: p.cp2x + dx,
        cp2y: p.cp2y + dy,
      };
    }),
  };
}

/** Moves control point handle (cp1 or cp2) */
export function moveHandleCoords(
  path: BezierPath,
  target: string | number,
  handle: 'cp1' | 'cp2',
  newX: number,
  newY: number,
): BezierPath {
  return {
    ...path,
    points: path.points.map((p, idx) => {
      const match = typeof target === 'number' ? idx === target : p.id === target;
      if (!match) return p;
      if (handle === 'cp1') {
        const next: BezierPoint = { ...p, cp1x: newX, cp1y: newY };
        if (p.isSmooth) {
          // Keep cp2 mirrored opposite to cp1
          const dx = p.x - newX;
          const dy = p.y - newY;
          next.cp2x = p.x + dx;
          next.cp2y = p.y + dy;
        }
        return next;
      }
      const next: BezierPoint = { ...p, cp2x: newX, cp2y: newY };
      if (p.isSmooth) {
        // Keep cp1 mirrored opposite to cp2
        const dx = p.x - newX;
        const dy = p.y - newY;
        next.cp1x = p.x + dx;
        next.cp1y = p.y + dy;
      }
      return next;
    }),
  };
}

/** Simplifies path by dropping redundant points that are too close */
export function simplifyPath(path: BezierPath, minDistance = 14): BezierPath {
  if (path.points.length <= 4) return path;
  const filtered: BezierPoint[] = [path.points[0]];

  for (let i = 1; i < path.points.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = path.points[i];
    if (distance(prev.x, prev.y, curr.x, curr.y) >= minDistance) {
      filtered.push(curr);
    }
  }

  return smoothAllPoints({ ...path, points: filtered });
}

/** Smooths handles across all points */
export function smoothAllPoints(path: BezierPath): BezierPath {
  const n = path.points.length;
  if (n < 3) return path;

  const points = path.points.map((p, i) => {
    const prev = path.points[(i - 1 + n) % n];
    const next = path.points[(i + 1) % n];
    const dx = (next.x - prev.x) * 0.25;
    const dy = (next.y - prev.y) * 0.25;
    return {
      ...p,
      cp1x: Math.round(p.x - dx),
      cp1y: Math.round(p.y - dy),
      cp2x: Math.round(p.x + dx),
      cp2y: Math.round(p.y + dy),
      isSmooth: true,
    };
  });

  return { ...path, points };
}

/** Converts BezierPath to SVG path `d` string */
export function pathToSvgD(path: BezierPath): string {
  if (path.points.length === 0) return '';
  const first = path.points[0];
  let d = `M ${first.x} ${first.y}`;

  for (let i = 0; i < path.points.length - 1; i++) {
    const cur = path.points[i];
    const next = path.points[i + 1];
    d += ` C ${cur.cp2x} ${cur.cp2y}, ${next.cp1x} ${next.cp1y}, ${next.x} ${next.y}`;
  }

  if (path.isClosed && path.points.length > 2) {
    const last = path.points[path.points.length - 1];
    d += ` C ${last.cp2x} ${last.cp2y}, ${first.cp1x} ${first.cp1y}, ${first.x} ${first.y} Z`;
  }

  return d;
}

/** Draws BezierPath directly into Canvas 2D context */
export function drawPathToCanvas(
  ctx: CanvasRenderingContext2D,
  path: BezierPath,
  scaleX = 1,
  scaleY = 1,
): void {
  if (path.points.length === 0) return;
  ctx.beginPath();
  const first = path.points[0];
  ctx.moveTo(first.x * scaleX, first.y * scaleY);

  for (let i = 0; i < path.points.length - 1; i++) {
    const cur = path.points[i];
    const next = path.points[i + 1];
    ctx.bezierCurveTo(
      cur.cp2x * scaleX,
      cur.cp2y * scaleY,
      next.cp1x * scaleX,
      next.cp1y * scaleY,
      next.x * scaleX,
      next.y * scaleY,
    );
  }

  if (path.isClosed && path.points.length > 2) {
    const last = path.points[path.points.length - 1];
    ctx.bezierCurveTo(
      last.cp2x * scaleX,
      last.cp2y * scaleY,
      first.cp1x * scaleX,
      first.cp1y * scaleY,
      first.x * scaleX,
      first.y * scaleY,
    );
    ctx.closePath();
  }
}

/**
 * Creates the high-fidelity Kingfisher bird path contour matching the reference photo
 */
export function createKingfisherReferencePath(w = 1200, h = 900): BezierPath {
  // Normalized 0..1 reference coordinates for the perched Kingfisher bird facing left
  const normPoints: [number, number, number, number, number, number][] = [
    // [x, y, cp1x, cp1y, cp2x, cp2y]
    [0.48, 0.22, 0.45, 0.23, 0.52, 0.22], // Crown top
    [0.42, 0.26, 0.44, 0.24, 0.38, 0.28], // Forehead / upper beak base
    [0.32, 0.3, 0.35, 0.29, 0.33, 0.31], // Beak tip
    [0.42, 0.32, 0.38, 0.32, 0.45, 0.33], // Lower beak base
    [0.46, 0.37, 0.45, 0.34, 0.46, 0.42], // Throat / chin
    [0.46, 0.48, 0.45, 0.43, 0.47, 0.55], // Orange breast
    [0.48, 0.62, 0.47, 0.58, 0.51, 0.66], // Lower belly
    [0.55, 0.7, 0.52, 0.68, 0.58, 0.73], // Feet / perch contact
    [0.6, 0.82, 0.58, 0.77, 0.61, 0.81], // Tail tip
    [0.61, 0.7, 0.61, 0.75, 0.61, 0.64], // Tail outer wing
    [0.6, 0.54, 0.61, 0.6, 0.59, 0.46], // Turquoise back / wing
    [0.56, 0.4, 0.58, 0.46, 0.55, 0.34], // Upper mantle
    [0.53, 0.28, 0.54, 0.32, 0.51, 0.25], // Nape / back of head
  ];

  const points: BezierPoint[] = normPoints.map((pt, idx) => ({
    id: `kf_${idx}`,
    x: Math.round(pt[0] * w),
    y: Math.round(pt[1] * h),
    cp1x: Math.round(pt[2] * w),
    cp1y: Math.round(pt[3] * h),
    cp2x: Math.round(pt[4] * w),
    cp2y: Math.round(pt[5] * h),
    isSmooth: true,
  }));

  return { points, isClosed: true };
}
