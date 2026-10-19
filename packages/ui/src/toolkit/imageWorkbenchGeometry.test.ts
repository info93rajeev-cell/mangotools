import { describe, expect, it } from 'vitest';
import {
  applyAspectRatio,
  aspectRatioValue,
  calculateFittedDisplay,
  clampRectToBounds,
  defaultSelectionRect,
  displayToSource,
  moveRect,
  resizeRect,
  sourceToDisplay,
} from './imageWorkbenchGeometry.ts';

describe('imageWorkbenchGeometry', () => {
  const bounds = { width: 800, height: 600 };

  describe('aspectRatioValue', () => {
    it('returns exact numeric ratio or null', () => {
      expect(aspectRatioValue('free')).toBeNull();
      expect(aspectRatioValue('1:1')).toBe(1);
      expect(aspectRatioValue('4:3')).toBeCloseTo(4 / 3);
      expect(aspectRatioValue('16:9')).toBeCloseTo(16 / 9);
      expect(aspectRatioValue('35:45')).toBeCloseTo(35 / 45);
    });
  });

  describe('calculateFittedDisplay', () => {
    it('fits wide image into container', () => {
      const fitted = calculateFittedDisplay(1600, 800, 400, 400);
      expect(fitted.scale).toBe(0.25);
      expect(fitted.width).toBe(400);
      expect(fitted.height).toBe(200);
    });

    it('fits tall image into container', () => {
      const fitted = calculateFittedDisplay(600, 1200, 400, 400);
      expect(fitted.scale).toBeCloseTo(400 / 1200);
      expect(fitted.width).toBe(200);
      expect(fitted.height).toBe(400);
    });

    it('caps scale at 1 for images smaller than container', () => {
      const fitted = calculateFittedDisplay(200, 150, 800, 600);
      expect(fitted.scale).toBe(1);
      expect(fitted.width).toBe(200);
      expect(fitted.height).toBe(150);
    });

    it('handles zero or negative dimensions safely', () => {
      expect(calculateFittedDisplay(0, 0, 100, 100)).toEqual({ width: 0, height: 0, scale: 1 });
    });
  });

  describe('clampRectToBounds', () => {
    it('keeps rect strictly inside bounds', () => {
      const clamped = clampRectToBounds({ x: -50, y: -20, width: 900, height: 700 }, bounds);
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0);
      expect(clamped.width).toBe(800);
      expect(clamped.height).toBe(600);
    });

    it('enforces minSize', () => {
      const clamped = clampRectToBounds({ x: 10, y: 10, width: 2, height: 4 }, bounds, 20);
      expect(clamped.width).toBe(20);
      expect(clamped.height).toBe(20);
    });

    it('clamps position when width or height would exceed bounds', () => {
      const clamped = clampRectToBounds({ x: 750, y: 550, width: 100, height: 100 }, bounds);
      expect(clamped.x).toBe(700);
      expect(clamped.y).toBe(500);
      expect(clamped.width).toBe(100);
      expect(clamped.height).toBe(100);
    });
  });

  describe('defaultSelectionRect', () => {
    it('creates centered 80% coverage in free mode', () => {
      const rect = defaultSelectionRect(bounds, 'free', 0.8);
      expect(rect.width).toBe(640);
      expect(rect.height).toBe(480);
      expect(rect.x).toBe(80);
      expect(rect.y).toBe(60);
    });

    it('creates centered square rect for 1:1 ratio', () => {
      const rect = defaultSelectionRect(bounds, '1:1', 0.8);
      expect(rect.width).toBe(480);
      expect(rect.height).toBe(480);
      expect(rect.x).toBe(160);
      expect(rect.y).toBe(60);
    });

    it('creates centered 35:45 passport photo ratio rect', () => {
      const rect = defaultSelectionRect(bounds, '35:45', 0.8);
      expect(rect.height).toBe(480);
      expect(rect.width).toBe(Math.round(480 * (35 / 45)));
      expect(rect.x).toBe(Math.round((800 - rect.width) / 2));
      expect(rect.y).toBe(60);
    });
  });

  describe('moveRect', () => {
    it('moves selection within bounds', () => {
      const start = { x: 100, y: 100, width: 200, height: 200 };
      const moved = moveRect(start, 50, -30, bounds);
      expect(moved).toEqual({ x: 150, y: 70, width: 200, height: 200 });
    });

    it('clamps at image edges during fast drags', () => {
      const start = { x: 100, y: 100, width: 200, height: 200 };
      const farLeft = moveRect(start, -500, -500, bounds);
      expect(farLeft.x).toBe(0);
      expect(farLeft.y).toBe(0);

      const farRight = moveRect(start, 1000, 1000, bounds);
      expect(farRight.x).toBe(600);
      expect(farRight.y).toBe(400);
    });
  });

  describe('resizeRect in free mode', () => {
    const start = { x: 200, y: 200, width: 200, height: 200 };

    it('resizes from se corner', () => {
      const r = resizeRect(start, 'se', 50, 40, bounds, 'free');
      expect(r).toEqual({ x: 200, y: 200, width: 250, height: 240 });
    });

    it('resizes from nw corner moving origin', () => {
      const r = resizeRect(start, 'nw', 30, 40, bounds, 'free');
      expect(r).toEqual({ x: 230, y: 240, width: 170, height: 160 });
    });

    it('resizes from side handles e and s', () => {
      const rE = resizeRect(start, 'e', 60, 0, bounds, 'free');
      expect(rE).toEqual({ x: 200, y: 200, width: 260, height: 200 });

      const rS = resizeRect(start, 's', 0, 80, bounds, 'free');
      expect(rS).toEqual({ x: 200, y: 200, width: 200, height: 280 });
    });

    it('enforces minSize when shrinking past zero', () => {
      const r = resizeRect(start, 'se', -300, -300, bounds, 'free', 25);
      expect(r.width).toBe(25);
      expect(r.height).toBe(25);
    });
  });

  describe('resizeRect in locked aspect ratio mode', () => {
    const start = { x: 200, y: 200, width: 200, height: 200 };

    it('maintains 1:1 ratio when resizing se corner', () => {
      const r = resizeRect(start, 'se', 50, 20, bounds, '1:1');
      expect(r.width).toBe(250);
      expect(r.height).toBe(250);
    });

    it('maintains ratio when resizing side handles', () => {
      const r = resizeRect(start, 'e', 40, 0, bounds, '1:1');
      expect(r.width).toBe(240);
      expect(r.height).toBe(240);
      expect(r.x).toBe(200);
      expect(r.y).toBe(180);
    });

    it('clamps to bounds on locked ratio expansion', () => {
      const nearEdge = { x: 700, y: 100, width: 80, height: 80 };
      const r = resizeRect(nearEdge, 'se', 200, 200, bounds, '1:1');
      expect(r.x + r.width).toBeLessThanOrEqual(bounds.width);
      expect(r.y + r.height).toBeLessThanOrEqual(bounds.height);
      expect(r.width).toBe(r.height);
    });
  });

  describe('applyAspectRatio', () => {
    it('adjusts width and height to 1:1 while maintaining center', () => {
      const rect = { x: 100, y: 100, width: 300, height: 200 };
      const adjusted = applyAspectRatio(rect, '1:1', bounds);
      expect(adjusted.width).toBe(adjusted.height);
      expect(adjusted.x + adjusted.width / 2).toBeCloseTo(250);
      expect(adjusted.y + adjusted.height / 2).toBeCloseTo(200);
    });

    it('returns same rect for free mode', () => {
      const rect = { x: 50, y: 50, width: 100, height: 200 };
      expect(applyAspectRatio(rect, 'free', bounds)).toEqual(rect);
    });
  });

  describe('coordinate conversions', () => {
    it('converts source to display and back cleanly', () => {
      const source = { x: 120, y: 80, width: 400, height: 300 };
      const scale = 0.5;
      const display = sourceToDisplay(source, scale);
      expect(display).toEqual({ left: 60, top: 40, width: 200, height: 150 });

      const back = displayToSource(display, scale, bounds);
      expect(back).toEqual(source);
    });
  });
});
