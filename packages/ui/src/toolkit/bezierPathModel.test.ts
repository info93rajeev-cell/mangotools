import { describe, expect, it } from 'vitest';
import {
  createKingfisherReferencePath,
  cubicBezierPoint,
  deletePointById,
  distance,
  findClosestSegment,
  insertPointAt,
  moveHandleCoords,
  movePointCoords,
  pathToSvgD,
  simplifyPath,
  smoothAllPoints,
} from './bezierPathModel.ts';

describe('bezierPathModel', () => {
  it('calculates Euclidean distance correctly', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distance(1, 1, 1, 1)).toBe(0);
  });

  it('computes cubic bezier interpolation along t in [0, 1]', () => {
    const p0 = { x: 0, y: 0 };
    const cp1 = { x: 0, y: 10 };
    const cp2 = { x: 10, y: 10 };
    const p1 = { x: 10, y: 0 };

    const start = cubicBezierPoint(p0, cp1, cp2, p1, 0);
    expect(start.x).toBeCloseTo(0);
    expect(start.y).toBeCloseTo(0);

    const end = cubicBezierPoint(p0, cp1, cp2, p1, 1);
    expect(end.x).toBeCloseTo(10);
    expect(end.y).toBeCloseTo(0);

    const mid = cubicBezierPoint(p0, cp1, cp2, p1, 0.5);
    expect(mid.x).toBeCloseTo(5);
    expect(mid.y).toBeGreaterThan(5);
  });

  it('creates reference Kingfisher path with closed loop', () => {
    const kfPath = createKingfisherReferencePath(1200, 900);
    expect(kfPath.isClosed).toBe(true);
    expect(kfPath.points.length).toBeGreaterThanOrEqual(10);
    expect(kfPath.points[0].x).toBeGreaterThan(0);
    expect(kfPath.points[0].y).toBeGreaterThan(0);
  });

  it('converts BezierPath to SVG path d string', () => {
    const kfPath = createKingfisherReferencePath(600, 450);
    const d = pathToSvgD(kfPath);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.includes(' C ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
  });

  it('finds closest segment for adding points', () => {
    const kfPath = createKingfisherReferencePath(1000, 800);
    const p0 = kfPath.points[0];
    const hit = findClosestSegment(kfPath, p0.x + 2, p0.y + 2);
    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeLessThan(100);
  });

  it('inserts and deletes points along the path', () => {
    const kfPath = createKingfisherReferencePath(1000, 800);
    const origCount = kfPath.points.length;

    const inserted = insertPointAt(kfPath, 1, 0.5);
    expect(inserted.points.length).toBe(origCount + 1);

    const insertedId = inserted.points[2].id;
    const deleted = deletePointById(inserted, insertedId);
    expect(deleted.points.length).toBe(origCount);
  });

  it('moves points and handles with coordinate updates', () => {
    const kfPath = createKingfisherReferencePath(1000, 800);
    const moved = movePointCoords(kfPath, 0, 500, 300);
    expect(moved.points[0].x).toBe(500);
    expect(moved.points[0].y).toBe(300);

    const handleMoved = moveHandleCoords(moved, 0, 'cp1', 480, 290);
    expect(handleMoved.points[0].cp1x).toBe(480);
    expect(handleMoved.points[0].cp1y).toBe(290);
  });

  it('smooths and simplifies path points', () => {
    const kfPath = createKingfisherReferencePath(1000, 800);
    const smoothed = smoothAllPoints(kfPath);
    expect(smoothed.points.length).toBe(kfPath.points.length);

    const simplified = simplifyPath(kfPath, 50);
    expect(simplified.points.length).toBeLessThanOrEqual(kfPath.points.length);
  });
});
