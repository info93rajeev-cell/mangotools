import { describe, expect, it } from 'vitest';
import { boxMean, refineCutoutEdges, sampleAt } from './alphaEdgeRefinement.ts';

const RED = [220, 30, 40, 255];
const stripe = (y: number) => (y % 8 < 4 ? [20, 200, 40, 255] : [20, 120, 200, 255]);

/** Red subject left of `edge`, busy green/blue striped background on the right. */
function scene(w: number, h: number, edge: number) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) rgba.set(x < edge ? RED : stripe(y), (y * w + x) * 4);
  }
  return rgba;
}

/** A soft mask like an upscaled 512px model output: a 24px linear ramp centred on the edge. */
function softMask(w: number, h: number, edge: number, ramp: number) {
  const m = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = Math.min(1, Math.max(0, (edge + ramp / 2 - x) / ramp));
      m[(y * w + x) * 4 + 3] = Math.round(t * 255);
    }
  }
  return m;
}

const alphaAt = (buf: Uint8ClampedArray, w: number, x: number, y: number) =>
  (buf[(y * w + x) * 4 + 3] ?? 0) / 255;

describe('alpha edge refinement', () => {
  it('box mean keeps constants and averages a step', () => {
    const p = { w: 5, h: 1, data: Float32Array.from([0, 0, 1, 1, 1]) };
    expect(Array.from(boxMean({ w: 3, h: 1, data: Float32Array.from([2, 2, 2]) }, 1).data)).toEqual(
      [2, 2, 2],
    );
    expect(boxMean(p, 1).data[1]).toBeCloseTo(1 / 3, 5);
    expect(sampleAt({ w: 2, h: 1, data: Float32Array.from([0, 1]) }, 1, 0, 1)).toBe(1);
  });

  it('snaps a soft model edge to the real image edge', () => {
    // A 1024 px photo: the 512 px model mask is stretched 2×, giving an ~8 px soft edge.
    const w = 1024;
    const h = 48;
    const rgba = scene(w, h, 512);
    const raw = softMask(w, h, 512, 8);
    const out = refineCutoutEdges(rgba, raw, w, h);
    // 2 px inside the subject the raw mask is ~0.75; refined is (almost) solid.
    expect(alphaAt(raw, w, 510, 20)).toBeLessThan(0.8);
    expect(alphaAt(out, w, 510, 20)).toBeGreaterThan(0.9);
    // 2 px into the background the raw mask still leaks ~0.25; refined is (almost) clear.
    expect(alphaAt(raw, w, 514, 20)).toBeGreaterThan(0.2);
    expect(alphaAt(out, w, 514, 20)).toBeLessThan(0.1);
  });

  it('keeps solid areas exact and removes the background tint from edge colours', () => {
    const w = 1024;
    const h = 48;
    const rgba = scene(w, h, 512);
    const out = refineCutoutEdges(rgba, softMask(w, h, 512, 8), w, h);
    const o = (20 * w + 10) * 4;
    expect([out[o], out[o + 1], out[o + 2], out[o + 3]]).toEqual([220, 30, 40, 255]);
    for (let x = 500; x < 524; x++) {
      const p = (20 * w + x) * 4;
      if ((out[p + 3] ?? 0) > 10) expect(out[p + 1] ?? 0).toBeLessThan(90); // no green fringe
    }
  });

  it('leaves the far background fully transparent', () => {
    const w = 1024;
    const h = 48;
    const out = refineCutoutEdges(scene(w, h, 512), softMask(w, h, 512, 8), w, h);
    expect(alphaAt(out, w, 1000, 5)).toBe(0);
  });

  it('recovers a thin strand (feather, hair) the model only saw faintly', () => {
    const w = 1024;
    const h = 48;
    const rgba = scene(w, h, 300);
    for (let y = 0; y < h; y++) {
      for (const x of [600, 601]) rgba.set([220, 30, 40, 255], (y * w + x) * 4);
    }
    const raw = softMask(w, h, 300, 8);
    for (let y = 0; y < h; y++) {
      for (let x = 596; x <= 606; x++) {
        raw[(y * w + x) * 4 + 3] = Math.round(Math.max(0, 0.3 - Math.abs(x - 601) * 0.06) * 255);
      }
    }
    const out = refineCutoutEdges(rgba, raw, w, h);
    expect(alphaAt(raw, w, 600, 20)).toBeLessThan(0.3);
    expect(alphaAt(out, w, 600, 20)).toBeGreaterThan(0.9);
    expect(alphaAt(out, w, 601, 20)).toBeGreaterThan(0.9);
    expect(alphaAt(out, w, 597, 20)).toBeLessThan(0.05);
    expect(alphaAt(out, w, 604, 20)).toBeLessThan(0.05);
    const o = (20 * w + 600) * 4;
    expect(out[o] ?? 0).toBeGreaterThan(200);
    expect(out[o + 1] ?? 0).toBeLessThan(60);
  });

  it('never erases a confident subject part that resembles the background', () => {
    // An orange bird with a narrow strip of green moss below it (like the kingfisher's branch),
    // against a green/blue background. The model marked the moss as subject.
    const w = 1024;
    const h = 48;
    const MOSS = [40, 170, 60, 255];
    const ORANGE = [230, 120, 30, 255];
    const colourAt = (x: number, y: number) => (x < 496 ? ORANGE : x < 512 ? MOSS : stripe(y));
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) rgba.set(colourAt(x, y), (y * w + x) * 4);
    const raw = softMask(w, h, 512, 8);
    const out = refineCutoutEdges(rgba, raw, w, h);
    for (const x of [498, 502, 506]) expect(alphaAt(out, w, x, 20)).toBeGreaterThan(0.85);
  });
});
