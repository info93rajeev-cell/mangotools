import { describe, expect, it } from 'vitest';
import { recoverFineStructures } from './guidedDetailRecovery.ts';

describe('recoverFineStructures', () => {
  it('preserves foreground pixels and does not modify empty masks', () => {
    const w = 10;
    const h = 10;
    const rawAlpha = new Float32Array(w * h);
    const ref = new Uint8ClampedArray(w * h * 4);
    const bg = { r: 240, g: 240, b: 240, tolerance: 20 };

    const recovered = recoverFineStructures(rawAlpha, ref, w, h, bg);
    expect(recovered).toEqual(rawAlpha);
  });

  it('recovers thin stem connected to foreground object', () => {
    const w = 20;
    const h = 20;
    const rawAlpha = new Float32Array(w * h);
    const ref = new Uint8ClampedArray(w * h * 4);

    // Wall background: [240, 240, 240]
    for (let i = 0; i < w * h; i++) {
      ref[i * 4] = 240;
      ref[i * 4 + 1] = 240;
      ref[i * 4 + 2] = 240;
      ref[i * 4 + 3] = 255;
    }

    // Foreground base object at y: 15..19, x: 8..12
    for (let y = 15; y < 20; y++) {
      for (let x = 8; x < 13; x++) {
        const idx = y * w + x;
        rawAlpha[idx] = 1.0;
        ref[idx * 4] = 50; // dark object
        ref[idx * 4 + 1] = 50;
        ref[idx * 4 + 2] = 50;
      }
    }

    // Thin 1px stem extending upwards at x = 10, y: 5..14 (rawAlpha is 0, but ref is dark)
    for (let y = 5; y < 15; y++) {
      const idx = y * w + 10;
      // rawAlpha is left at 0.0 (simulating AI dropping the stem)
      ref[idx * 4] = 60; // dark stem
      ref[idx * 4 + 1] = 60;
      ref[idx * 4 + 2] = 60;
    }

    const bg = { r: 240, g: 240, b: 240, tolerance: 20 };
    const recovered = recoverFineStructures(rawAlpha, ref, w, h, bg, 15);

    // Check that the stem pixels were recovered with positive alpha!
    for (let y = 5; y < 15; y++) {
      const idx = y * w + 10;
      expect(recovered[idx]).toBeGreaterThan(0.4);
    }

    // Pixels far away from the stem should remain 0
    expect(recovered[5 * w + 2]).toBe(0);
    expect(recovered[5 * w + 18]).toBe(0);
  });
});
