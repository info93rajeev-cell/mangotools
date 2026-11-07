import { describe, expect, it } from 'vitest';
import type { BezierPath } from './bezierPathModel.ts';
import {
  appendOpenPoint,
  canClosePath,
  closePath,
  isOnFirstPoint,
  pullHandles,
  toggleCurvePoint,
} from './penPathEditing.ts';

const empty: BezierPath = { points: [], isClosed: false };

function triangle(): BezierPath {
  return appendOpenPoint(appendOpenPoint(appendOpenPoint(empty, 0, 0), 100, 0), 100, 100);
}

describe('pen path editing', () => {
  it('keeps the path open while points are placed', () => {
    const p = triangle();
    expect(p.points).toHaveLength(3);
    expect(p.isClosed).toBe(false);
  });

  it('closes only with three or more points', () => {
    const two = appendOpenPoint(appendOpenPoint(empty, 0, 0), 10, 0);
    expect(canClosePath(two)).toBe(false);
    expect(closePath(two).isClosed).toBe(false);
    expect(canClosePath(triangle())).toBe(true);
    expect(closePath(triangle()).isClosed).toBe(true);
  });

  it('does not add points to a closed path', () => {
    const closed = closePath(triangle());
    expect(appendOpenPoint(closed, 5, 5)).toBe(closed);
  });

  it('detects a click on the first point within the tolerance', () => {
    expect(isOnFirstPoint(triangle(), 4, 3, 6)).toBe(true);
    expect(isOnFirstPoint(triangle(), 20, 0, 6)).toBe(false);
    expect(isOnFirstPoint(empty, 0, 0, 6)).toBe(false);
  });

  it('drag-out makes mirrored handles', () => {
    const p = pullHandles(triangle(), 1, 130, 20).points[1];
    expect(p).toMatchObject({ cp2x: 130, cp2y: 20, cp1x: 70, cp1y: -20, isSmooth: true });
  });

  it('corner to curve and back', () => {
    const curved = toggleCurvePoint(triangle(), 1).points[1];
    expect(curved?.isSmooth).toBe(true);
    // handles lie on the line from point 0 (0,0) to point 2 (100,100)
    expect(curved?.cp2x).toBeCloseTo(100 + (100 / Math.SQRT2) * (Math.SQRT2 / 6), 6);
    expect(curved?.cp2y).toBeCloseTo(100 / 6, 6);
    const corner = toggleCurvePoint(toggleCurvePoint(triangle(), 1), 1).points[1];
    expect(corner).toMatchObject({ cp1x: 100, cp1y: 0, cp2x: 100, cp2y: 0, isSmooth: false });
  });
});
