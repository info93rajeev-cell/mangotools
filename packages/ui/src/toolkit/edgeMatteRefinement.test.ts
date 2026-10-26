import { describe, expect, it } from 'vitest';
import {
  applySubpixelSmoothing,
  detectBackgroundFromPerimeter,
  refineAlphaMask,
} from './edgeMatteRefinement.ts';

describe('edgeMatteRefinement', () => {
  it('detectBackgroundFromPerimeter withstands corner occluders via median filtering', () => {
    const w = 20;
    const h = 20;
    const ref = new Uint8ClampedArray(w * h * 4);

    // Fill mostly white wall: 240, 240, 240
    for (let i = 0; i < w * h; i++) {
      ref[i * 4] = 240;
      ref[i * 4 + 1] = 240;
      ref[i * 4 + 2] = 240;
      ref[i * 4 + 3] = 255;
    }

    // Place a dark green plant at left perimeter (x = 0..2)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < 3; x++) {
        const idx = (y * w + x) * 4;
        ref[idx] = 30;
        ref[idx + 1] = 60;
        ref[idx + 2] = 30;
      }
    }

    const bg = detectBackgroundFromPerimeter(ref, w, h);
    // Background should closely match the dominant white wall, not the plant
    expect(bg.r).toBeGreaterThan(200);
    expect(bg.g).toBeGreaterThan(200);
    expect(bg.b).toBeGreaterThan(200);
  });

  it('refineAlphaMask applies glass transmission physics in glass mode', () => {
    const w = 4;
    const h = 4;
    const total = w * h;
    const rawAlpha = new Float32Array(total).fill(0.9);
    const ref = new Uint8ClampedArray(total * 4);

    // Pixel 0: Saturated red glass (R=200, G=30, B=30)
    ref[0] = 200;
    ref[1] = 30;
    ref[2] = 30;
    ref[3] = 255;

    // Pixel 1: Specular highlight (R=245, G=245, B=245)
    ref[4] = 245;
    ref[5] = 245;
    ref[6] = 245;
    ref[7] = 255;

    const bg = { r: 240, g: 240, b: 240, isUniform: false, tolerance: 20 };
    const refined = refineAlphaMask(rawAlpha, ref, w, h, bg, 'glass');

    // Red glass pixel should have soft transmission alpha
    expect(refined[0]).toBeGreaterThanOrEqual(0.35);
    expect(refined[0]).toBeLessThanOrEqual(0.68);

    // Specular highlight stays solid
    expect(refined[1]).toBeCloseTo(0.9, 2);
  });

  it('applySubpixelSmoothing smooths fractional boundary alpha', () => {
    const w = 5;
    const h = 5;
    const alpha = new Float32Array(w * h).fill(0);
    // Set a step edge at center
    alpha[2 * w + 2] = 0.5;
    alpha[2 * w + 1] = 1.0;
    alpha[2 * w + 3] = 0.0;

    const smoothed = applySubpixelSmoothing(alpha, w, h, 2);
    expect(smoothed[2 * w + 2]).toBeGreaterThan(0);
    expect(smoothed[2 * w + 2]).toBeLessThan(1);
  });
});
