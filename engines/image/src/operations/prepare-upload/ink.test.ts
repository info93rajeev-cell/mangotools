import { describe, expect, it } from 'vitest';
import { calculatePaddedFittedBounds, findInkBoundingBox, isInkPixel } from './ink.ts';

describe('ink detection and signature bounds', () => {
  it('distinguishes ink from white/cream paper and transparent backgrounds', () => {
    // Transparent is background
    expect(isInkPixel(0, 0, 0, 0)).toBe(false);
    expect(isInkPixel(0, 0, 0, 24)).toBe(false);

    // Black and dark blue pen ink
    expect(isInkPixel(0, 0, 0, 255)).toBe(true);
    expect(isInkPixel(20, 40, 160, 255)).toBe(true);
    expect(isInkPixel(80, 80, 80, 255)).toBe(true);

    // White, cream, and light gray scanner backgrounds
    expect(isInkPixel(255, 255, 255, 255)).toBe(false);
    expect(isInkPixel(245, 240, 230, 255)).toBe(false);
    expect(isInkPixel(235, 235, 235, 255)).toBe(false);
  });

  it('detects ink bounding box inside transparent image and trims empty borders', () => {
    const width = 40;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);

    // Place ink at x=10..29, y=6..13
    for (let y = 6; y <= 13; y++) {
      for (let x = 10; x <= 29; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 10;
        data[idx + 1] = 10;
        data[idx + 2] = 10;
        data[idx + 3] = 255;
      }
    }

    const box = findInkBoundingBox(data, width, height);
    expect(box.x).toBeLessThanOrEqual(10);
    expect(box.y).toBeLessThanOrEqual(6);
    expect(box.x + box.width).toBeGreaterThanOrEqual(30);
    expect(box.y + box.height).toBeGreaterThanOrEqual(14);
    // Trims out empty border space
    expect(box.width).toBeLessThan(width);
    expect(box.height).toBeLessThan(height);
  });

  it('detects dark ink on white paper background and trims margins', () => {
    const width = 50;
    const height = 30;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with white paper
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 250;
      data[i + 1] = 250;
      data[i + 2] = 250;
      data[i + 3] = 255;
    }

    // Draw ink strokes at x=15..35, y=10..20
    for (let y = 10; y <= 20; y++) {
      for (let x = 15; x <= 35; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 20;
        data[idx + 1] = 30;
        data[idx + 2] = 120; // Blue pen
        data[idx + 3] = 255;
      }
    }

    const box = findInkBoundingBox(data, width, height);
    expect(box.x).toBeLessThanOrEqual(15);
    expect(box.y).toBeLessThanOrEqual(10);
    expect(box.x + box.width).toBeGreaterThanOrEqual(36);
    expect(box.y + box.height).toBeGreaterThanOrEqual(21);
    expect(box.width).toBeLessThan(width);
    expect(box.height).toBeLessThan(height);
  });

  it('safely falls back to full bounds if canvas is blank (no ink detected)', () => {
    const width = 30;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    // All zero (transparent)
    expect(findInkBoundingBox(data, width, height)).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 20,
    });

    // All white (blank paper)
    data.fill(255);
    expect(findInkBoundingBox(data, width, height)).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 20,
    });
  });

  it('scales 144x66 signature into 644x466 box with ~8% controlled padding and exact centering', () => {
    const signatureBox = { x: 0, y: 0, width: 144, height: 66 };
    const target = { width: 644, height: 466 };

    const bounds = calculatePaddedFittedBounds(signatureBox, target, 0.08);

    // Upscales (no Math.min(1, ...) clamp)
    expect(bounds.destWidth).toBeGreaterThan(signatureBox.width);
    expect(bounds.destHeight).toBeGreaterThan(signatureBox.height);

    // Fits inside target canvas
    expect(bounds.destWidth).toBeLessThanOrEqual(644);
    expect(bounds.destHeight).toBeLessThanOrEqual(466);

    // Respects ~8% padding constraint (destWidth <= 644 * 0.85 = 547)
    expect(bounds.destWidth).toBeLessThanOrEqual(Math.round(644 * 0.85));

    // Centered horizontally and vertically
    expect(bounds.destX).toBe(Math.round((target.width - bounds.destWidth) / 2));
    expect(bounds.destY).toBe(Math.round((target.height - bounds.destHeight) / 2));

    // Preserves aspect ratio accurately
    const originalAspect = signatureBox.width / signatureBox.height;
    const scaledAspect = bounds.destWidth / bounds.destHeight;
    expect(Math.abs(originalAspect - scaledAspect)).toBeLessThan(0.02);
  });

  it('downscales large 2000x800 scan into 140x60 target box with padding', () => {
    const signatureBox = { x: 0, y: 0, width: 2000, height: 800 };
    const target = { width: 140, height: 60 };

    const bounds = calculatePaddedFittedBounds(signatureBox, target, 0.08);

    expect(bounds.destWidth).toBeLessThan(target.width);
    expect(bounds.destHeight).toBeLessThan(target.height);
    expect(bounds.destX).toBe(Math.round((target.width - bounds.destWidth) / 2));
    expect(bounds.destY).toBe(Math.round((target.height - bounds.destHeight) / 2));
  });
});
