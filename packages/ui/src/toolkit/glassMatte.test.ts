import { describe, expect, it } from 'vitest';
import { glassMatte } from './glassMatte.ts';

const W = 160;
const H = 100;

/** Lavender-to-white wall, like a studio sweep. */
function wall(x: number, y: number): [number, number, number] {
  const t = (x / W + y / H) / 2;
  return [190 + 40 * t, 188 + 40 * t, 220 + 20 * t];
}

type Region = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  px: (x: number, y: number) => number[];
};

function scene(regions: Region[]) {
  const rgba = new Uint8ClampedArray(W * H * 4);
  const cut = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const hit = regions.find((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
      const c = hit ? hit.px(x, y) : wall(x, y);
      rgba.set([c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, 255], o);
      cut[o + 3] = hit ? 255 : 0;
    }
  }
  return { rgba, cut };
}

const glass: Region = {
  x0: 20,
  x1: 50,
  y0: 30,
  y1: 70,
  px: (x, y) => wall(x, y).map((v) => v - 8),
};
const whitePlastic: Region = { x0: 70, x1: 95, y0: 30, y1: 70, px: () => [245, 245, 248] };
const redBoot: Region = { x0: 110, x1: 140, y0: 30, y1: 70, px: () => [230, 40, 45] };

function alphaAt(out: Uint8ClampedArray, x: number, y: number) {
  return (out[(y * W + x) * 4 + 3] ?? 0) / 255;
}

describe('glassMatte', () => {
  const { rgba, cut } = scene([glass, whitePlastic, redBoot]);
  const out = glassMatte(rgba, cut, W, H);

  it('makes glass (close to the wall behind it) see-through', () => {
    const a = alphaAt(out, 35, 50);
    expect(a).toBeGreaterThan(0.1);
    expect(a).toBeLessThan(0.45);
  });

  it('keeps white plastic and coloured parts solid', () => {
    expect(alphaAt(out, 82, 50)).toBeGreaterThan(0.95);
    expect(alphaAt(out, 125, 50)).toBeGreaterThan(0.97);
  });

  it('removes the background outside the subject', () => {
    expect(alphaAt(out, 5, 5)).toBe(0);
    expect(alphaAt(out, 155, 95)).toBe(0);
  });

  it('takes the old wall colour out of the glass pixels', () => {
    const o = (50 * W + 35) * 4;
    // The glass is slightly darker than the wall; with the wall removed it is darker still,
    // so on a new background only the glass itself (not the lavender wall) is drawn.
    expect(out[o] ?? 0).toBeLessThan((rgba[o] ?? 0) - 10);
    expect(out[o + 2] ?? 0).toBeLessThan((rgba[o + 2] ?? 0) - 10);
  });
});
