import { describe, expect, it } from 'vitest';
import { applySelectionGlassPass, applySelectionGlassStrip } from './selectionGlassPass.ts';

// Synthetic scene:
// Width 100, Height 100.
// Wall: gradient from [200, 200, 200] at top to [220, 220, 220] at bottom.
// 1. Glass rectangle: [x: 10..30, y: 10..30], 9 levels darker than wall.
// 2. White plastic block: [x: 40..60, y: 10..30], same tint as wall (e.g. wall + 2).
// 3. Red block: [x: 70..90, y: 10..30], [220, 30, 30].
function getPixelRgb(x: number, y: number, wallVal: number): [number, number, number, boolean] {
  if (x >= 10 && x <= 30 && y >= 10 && y <= 30) {
    return [wallVal - 9, wallVal - 9, wallVal - 9, true];
  }
  if (x >= 40 && x <= 60 && y >= 10 && y <= 30) {
    const val = Math.min(255, wallVal + 2);
    return [val, val, val, true];
  }
  if (x >= 70 && x <= 90 && y >= 10 && y <= 30) {
    return [220, 30, 30, true];
  }
  return [wallVal, wallVal, wallVal, false];
}

function createScene() {
  const w = 100;
  const h = 100;
  const photo = new Uint8ClampedArray(w * h * 4);
  const selMask = new Uint8ClampedArray(w * h * 4);
  const glassMask = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    const wallVal = Math.round(200 + (20 * y) / h);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [r, g, b, isSubject] = getPixelRgb(x, y, wallVal);

      photo[idx] = r;
      photo[idx + 1] = g;
      photo[idx + 2] = b;
      photo[idx + 3] = 255;

      selMask[idx] = 255;
      selMask[idx + 1] = 255;
      selMask[idx + 2] = 255;
      selMask[idx + 3] = isSubject ? 255 : 0;
    }
  }

  return { w, h, photo, selMask, glassMask };
}

function meanAlphaInBox(
  buf: Uint8ClampedArray,
  w: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number {
  let sum = 0;
  let count = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      sum += buf[(y * w + x) * 4 + 3] / 255;
      count++;
    }
  }
  return sum / count;
}

describe('selectionGlassPass', () => {
  it('with glass rectangle painted: glass mean alpha < 0.5, white and red block alpha > 0.97', () => {
    const { w, h, photo, selMask, glassMask } = createScene();
    for (let y = 10; y <= 30; y++) {
      for (let x = 10; x <= 30; x++) {
        glassMask[(y * w + x) * 4 + 3] = 255;
      }
    }

    const out = applySelectionGlassPass(photo, selMask, glassMask, w, h);
    const glassMeanAlpha = meanAlphaInBox(out, w, 10, 30, 10, 30);
    expect(glassMeanAlpha).toBeLessThan(0.5);

    const whiteMeanAlpha = meanAlphaInBox(out, w, 40, 60, 10, 30);
    expect(whiteMeanAlpha).toBeGreaterThan(0.97);

    const redMeanAlpha = meanAlphaInBox(out, w, 70, 90, 10, 30);
    expect(redMeanAlpha).toBeGreaterThan(0.97);
  });

  it('with nothing painted: everything selected stays alpha 1 (no see-through at all)', () => {
    const { w, h, photo, selMask, glassMask } = createScene();
    // Glass mask has nothing painted (all zeros)
    const out = applySelectionGlassPass(photo, selMask, glassMask, w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (selMask[idx + 3] === 255) {
          expect(out[idx + 3]).toBe(255);
        }
      }
    }
  });

  it('painting glass over the white block makes it see-through (the brush wins)', () => {
    const { w, h, photo, selMask, glassMask } = createScene();
    // Paint glass over white block
    for (let y = 10; y <= 30; y++) {
      for (let x = 40; x <= 60; x++) {
        glassMask[(y * w + x) * 4 + 3] = 255;
      }
    }

    const out = applySelectionGlassPass(photo, selMask, glassMask, w, h);
    let whiteAlphaSum = 0;
    let whiteCount = 0;
    for (let y = 10; y <= 30; y++) {
      for (let x = 40; x <= 60; x++) {
        whiteAlphaSum += out[(y * w + x) * 4 + 3] / 255;
        whiteCount++;
      }
    }
    const whiteMeanAlpha = whiteAlphaSum / whiteCount;
    expect(whiteMeanAlpha).toBeLessThan(0.5);
  });

  it('strip-by-strip equals whole-image', () => {
    const { w, h, photo, selMask, glassMask } = createScene();
    for (let y = 10; y <= 30; y++) {
      for (let x = 10; x <= 30; x++) {
        glassMask[(y * w + x) * 4 + 3] = 255;
      }
    }

    const whole = applySelectionGlassPass(photo, selMask, glassMask, w, h);

    // Run in strips of 25 rows
    const stripOut = new Uint8ClampedArray(w * h * 4);
    const stripHeight = 25;
    for (let y0 = 0; y0 < h; y0 += stripHeight) {
      const rows = Math.min(stripHeight, h - y0);
      const stripRes = applySelectionGlassStrip(photo, selMask, glassMask, w, h, y0, rows);
      stripOut.set(stripRes, y0 * w * 4);
    }

    expect(Array.from(stripOut)).toEqual(Array.from(whole));
  });
});
