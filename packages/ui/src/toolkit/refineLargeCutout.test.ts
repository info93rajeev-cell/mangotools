import { describe, expect, it } from 'vitest';
import { mergeStrip } from './refineLargeCutout.ts';

describe('mergeStrip (photos over 16 MP)', () => {
  // Three pixels: solid inside, soft edge, background.
  const orig = new Uint8ClampedArray([200, 100, 50, 255, 190, 110, 60, 255, 10, 20, 30, 255]);
  const refined = new Uint8ClampedArray([198, 99, 52, 255, 120, 80, 40, 128, 0, 0, 0, 0]);
  const out = mergeStrip(orig, refined);

  it('keeps the full-size original pixel where the subject is solid', () => {
    expect(Array.from(out.subarray(0, 4))).toEqual([200, 100, 50, 255]);
  });

  it('uses the refined pixel (cleaned colour, soft alpha) along edges', () => {
    expect(Array.from(out.subarray(4, 8))).toEqual([120, 80, 40, 128]);
  });

  it('keeps removed background transparent', () => {
    expect(out[11]).toBe(0);
  });
});
