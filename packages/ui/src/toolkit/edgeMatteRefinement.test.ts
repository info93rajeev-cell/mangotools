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
    const rawAlpha = new Float32Array(total).fill(0.8);
    const ref = new Uint8ClampedArray(total * 4);

    // Pixel 0: Luminous red tinted glass (R=230, G=110, B=110, Lum=146)
    ref[0] = 230;
    ref[1] = 110;
    ref[2] = 110;
    ref[3] = 255;

    // Pixel 1: Specular highlight (R=248, G=248, B=248)
    ref[4] = 248;
    ref[5] = 248;
    ref[6] = 248;
    ref[7] = 255;

    const bg = { r: 240, g: 240, b: 240, isUniform: false, tolerance: 20 };
    const refined = refineAlphaMask(rawAlpha, ref, w, h, bg, 'glass');

    // Luminous tinted glass pixel should have soft transmission alpha
    expect(refined[0]).toBeGreaterThanOrEqual(0.35);
    expect(refined[0]).toBeLessThanOrEqual(0.68);

    // Specular highlight stays solid
    expect(refined[1]).toBe(1.0);
  });

  it('refineAlphaMask in auto mode preserves solid foreground objects without fading', () => {
    const w = 2;
    const h = 2;
    const total = w * h;
    const rawAlpha = new Float32Array(total).fill(0.95);
    const ref = new Uint8ClampedArray(total * 4);

    // Deep red solid plastic / ceramic subject pixel
    ref[0] = 108;
    ref[1] = 0;
    ref[2] = 0;
    ref[3] = 255;

    // Deep blue solid object pixel
    ref[4] = 2;
    ref[5] = 16;
    ref[6] = 79;
    ref[7] = 255;

    const bg = { r: 245, g: 245, b: 245, isUniform: true, tolerance: 20 };
    const refined = refineAlphaMask(rawAlpha, ref, w, h, bg, 'auto');

    // Solid objects in Auto mode MUST remain 1.0 (never faded to 0.65!)
    expect(refined[0]).toBe(1.0);
    expect(refined[1]).toBe(1.0);
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

  it('detectBackgroundFromPerimeter detects dual-surface scene (wall and table floor)', () => {
    const w = 40;
    const h = 40;
    const ref = new Uint8ClampedArray(w * h * 4);

    // Fill top 45% with wall (R=240, G=240, B=240)
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        ref[idx] = 240;
        ref[idx + 1] = 240;
        ref[idx + 2] = 240;
        ref[idx + 3] = 255;
      }
    }

    // Fill bottom 45% with table floor (R=180, G=175, B=190)
    for (let y = 22; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        ref[idx] = 180;
        ref[idx + 1] = 175;
        ref[idx + 2] = 190;
        ref[idx + 3] = 255;
      }
    }

    // Foreground object in middle (y=18..21)
    for (let y = 18; y < 22; y++) {
      for (let x = 10; x < 30; x++) {
        const idx = (y * w + x) * 4;
        ref[idx] = 20;
        ref[idx + 1] = 40;
        ref[idx + 2] = 80;
        ref[idx + 3] = 255;
      }
    }

    const bg = detectBackgroundFromPerimeter(ref, w, h);
    expect(bg.hasTableFloor).toBe(true);
    expect(bg.wall).toBeDefined();
    expect(bg.floor).toBeDefined();
    expect(bg.wall?.r).toBeGreaterThan(230);
    expect(bg.floor?.r).toBeLessThan(190);
  });

  it('refineAlphaMask cleanly zeros out table reflections below contact baseline', () => {
    const w = 10;
    const h = 20;
    const total = w * h;
    const rawAlpha = new Float32Array(total).fill(0.85); // BiRefNet noisy output
    const ref = new Uint8ClampedArray(total * 4);

    // Set pixel colors
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (y < 8) {
          // Wall pixel
          ref[idx] = 240;
          ref[idx + 1] = 240;
          ref[idx + 2] = 240;
        } else if (y >= 8 && y < 14) {
          // Object pixel
          ref[idx] = 30;
          ref[idx + 1] = 50;
          ref[idx + 2] = 120;
        } else {
          // Table reflection pixel
          ref[idx] = 185;
          ref[idx + 1] = 175;
          ref[idx + 2] = 190;
        }
        ref[idx + 3] = 255;
      }
    }

    const bg = {
      r: 210,
      g: 205,
      b: 215,
      isUniform: true,
      tolerance: 20,
      hasTableFloor: true,
      contactBaseY: 13,
      wall: { r: 240, g: 240, b: 240, tolerance: 18 },
      floor: { r: 185, g: 175, b: 190, tolerance: 20 },
    };

    const refined = refineAlphaMask(rawAlpha, ref, w, h, bg, 'auto');

    // Below contactBaseY (y >= 16): 100% clean transparent (no table, no holes)
    const tablePixelIdx = 16 * w + 5;
    expect(refined[tablePixelIdx]).toBe(0.0);

    // Object area (y = 10): 100% solid
    const objectPixelIdx = 10 * w + 5;
    expect(refined[objectPixelIdx]).toBe(1.0);

    // Wall area (y = 2): 100% clean transparent
    const wallPixelIdx = 2 * w + 5;
    expect(refined[wallPixelIdx]).toBe(0.0);
  });
});
