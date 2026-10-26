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

  it('recovers diagonal branches and bridges 1-pixel gap in twigs', () => {
    const w = 25;
    const h = 25;
    const rawAlpha = new Float32Array(w * h);
    const ref = new Uint8ClampedArray(w * h * 4);

    // Wall background: [245, 245, 245]
    for (let i = 0; i < w * h; i++) {
      ref[i * 4] = 245;
      ref[i * 4 + 1] = 245;
      ref[i * 4 + 2] = 245;
      ref[i * 4 + 3] = 255;
    }

    // Vase base at y: 20..24, x: 10..14
    for (let y = 20; y < 25; y++) {
      for (let x = 10; x < 15; x++) {
        const idx = y * w + x;
        rawAlpha[idx] = 1.0;
        ref[idx * 4] = 40;
        ref[idx * 4 + 1] = 40;
        ref[idx * 4 + 2] = 40;
      }
    }

    // Diagonal branch from (y=19, x=12) up-right to (y=12, x=19)
    // with a 1-pixel gap at y=16, x=15 (gap left as wall color)
    for (let step = 1; step <= 7; step++) {
      const y = 20 - step;
      const x = 12 + step;
      if (y === 16 && x === 16) {
        // Gap in stem - left as wall color [245, 245, 245]
        continue;
      }
      const idx = y * w + x;
      ref[idx * 4] = 55;
      ref[idx * 4 + 1] = 55;
      ref[idx * 4 + 2] = 55;
    }

    const bg = { r: 245, g: 245, b: 245, tolerance: 20 };
    const recovered = recoverFineStructures(rawAlpha, ref, w, h, bg, 20);

    // Verify diagonal stem past the gap at (y=13, x=19) was successfully reached and recovered!
    const tipIdx = 13 * w + 19;
    expect(recovered[tipIdx]).toBeGreaterThan(0.4);

    // Verify background remains 0
    expect(recovered[13 * w + 2]).toBe(0);
  });
});
