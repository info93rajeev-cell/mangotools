import { describe, expect, it } from 'vitest';
import { proportions, scene, VIEW_BOX, VIEWS } from './cbmVisualGeometry.ts';

const coordinates = (points: string) =>
  points.split(' ').map((pair) => pair.split(',').map(Number) as [number, number]);

describe('CBM illustration proportions', () => {
  it('scales one package to its largest side and keeps tiny sides visible', () => {
    expect(proportions('60', '40', '40')).toEqual({ l: 1, w: 40 / 60, h: 40 / 60 });
    expect(proportions('1,000', '10', '500')).toEqual({ l: 1, w: 0.18, h: 0.5 });
  });

  it('draws nothing for missing, zero, negative or non-numeric sizes', () => {
    for (const sizes of [
      ['', '40', '30'],
      ['50', '0', '30'],
      ['50', '40', '-1'],
      ['50', 'x', '30'],
    ] as const)
      expect(proportions(...sizes)).toBeNull();
  });
});

describe('CBM illustration scene', () => {
  const p = proportions('50', '40', '30');
  if (!p) throw new Error('expected drawable proportions');

  it('draws a fixed 2 × 2 × 2 carton stack on a pallet, whatever the quantity', () => {
    const drawn = scene('iso', p);
    const cartons = drawn.polygons.filter((polygon) =>
      ['top', 'left', 'right'].includes(polygon.tone),
    );
    expect(cartons).toHaveLength(8 * 3);
    expect(drawn.polygons.filter((polygon) => polygon.tone === 'tape')).toHaveLength(8);
    expect(drawn.polygons.some((polygon) => polygon.tone === 'palletTop')).toBe(true);
  });

  it('labels the three dimensions of one package in the 3D view and two in flat views', () => {
    expect(scene('iso', p).arrows.map((arrow) => arrow.axis)).toEqual([
      'width',
      'length',
      'height',
    ]);
    expect(scene('top', p).arrows.map((arrow) => arrow.axis)).toEqual(['length', 'width']);
    expect(scene('front', p).arrows.map((arrow) => arrow.axis)).toEqual(['length', 'height']);
    expect(scene('side', p).arrows.map((arrow) => arrow.axis)).toEqual(['width', 'height']);
  });

  it('fits every view inside the view box', () => {
    for (const view of VIEWS) {
      const points = scene(view, p).polygons.flatMap((polygon) => coordinates(polygon.points));
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(VIEW_BOX.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(VIEW_BOX.height);
      }
    }
  });

  it('measures the whole stack, whose outer size is the package size', () => {
    const drawn = scene('front', p);
    const xs = drawn.polygons
      .filter((polygon) => polygon.tone === 'face')
      .flatMap((polygon) => coordinates(polygon.points).map(([x]) => x));
    const [lengthArrow] = drawn.arrows;
    expect(Math.abs((lengthArrow?.x2 ?? 0) - (lengthArrow?.x1 ?? 0))).toBeCloseTo(
      Math.max(...xs) - Math.min(...xs),
      0,
    );
  });

  it('draws the reference viewpoint: the width edge longer and flatter than the length edge', () => {
    const square = proportions('100', '100', '120');
    if (!square) throw new Error('expected drawable proportions');
    const [width, length] = scene('iso', square).arrows;
    const run = (a?: { x1: number; x2: number }) => Math.abs((a?.x2 ?? 0) - (a?.x1 ?? 0));
    const rise = (a?: { y1: number; y2: number }) => Math.abs((a?.y2 ?? 0) - (a?.y1 ?? 0));
    expect(run(width)).toBeGreaterThan(run(length));
    expect(rise(width) / run(width)).toBeLessThan(rise(length) / run(length));
  });

  it('moves larger phone labels further from their arrows', () => {
    const gap = (labelScale: number) => {
      const arrow = scene('iso', p, labelScale).arrows.find((a) => a.axis === 'height');
      return Math.abs((arrow?.x1 ?? 0) - (arrow?.labelX ?? 0));
    };
    expect(gap(1.45)).toBeGreaterThan(gap(1));
  });

  it('shows proportions: a taller package gives a taller front view', () => {
    const height = (sizes: [string, string, string]) => {
      const shape = proportions(...sizes);
      if (!shape) throw new Error('expected drawable proportions');
      const ys = scene('front', shape)
        .polygons.filter((polygon) => polygon.tone === 'face')
        .flatMap((polygon) => coordinates(polygon.points).map(([, y]) => y));
      const xs = scene('front', shape)
        .polygons.filter((polygon) => polygon.tone === 'face')
        .flatMap((polygon) => coordinates(polygon.points).map(([x]) => x));
      return (Math.max(...ys) - Math.min(...ys)) / (Math.max(...xs) - Math.min(...xs));
    };
    expect(height(['50', '40', '100'])).toBeGreaterThan(height(['50', '40', '30']));
  });
});
