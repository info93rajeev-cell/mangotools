import { describe, expect, it } from 'vitest';
import { hardenCutoutAlpha, hardenSolidAlpha } from './refineCutoutImage.ts';

describe('hardenSolidAlpha', () => {
  it('hardens alpha: < 0.15 -> 0, > 0.6 -> 1, linear in between', () => {
    expect(hardenSolidAlpha(0)).toBe(0);
    expect(hardenSolidAlpha(0.1)).toBe(0);
    expect(hardenSolidAlpha(0.15)).toBe(0);
    expect(hardenSolidAlpha(0.6)).toBe(1);
    expect(hardenSolidAlpha(0.8)).toBe(1);
    expect(hardenSolidAlpha(1.0)).toBe(1);
    expect(hardenSolidAlpha(0.375)).toBeCloseTo(0.5, 4);
  });

  it('keeps background 0 and makes partial alpha harder', () => {
    expect(hardenSolidAlpha(0)).toBe(0);
    expect(hardenSolidAlpha(0.4)).toBeCloseTo(0.5555, 3);
    expect(hardenSolidAlpha(0.7)).toBe(1);
  });
});

describe('synthetic cutout mode test (Auto vs Solid)', () => {
  it('a 0.4-alpha patch inside the subject stays 0.4 in Auto and becomes solid in Solid; background stays 0 in both', () => {
    // 3 pixels: background (alpha 0), subject patch (alpha 0.4), fully solid subject (alpha 1.0)
    const inAlphas = new Float32Array([0, 0.4, 1.0]);

    const autoAlphas = hardenCutoutAlpha(inAlphas, 'auto');
    expect(autoAlphas[0]).toBe(0);
    expect(autoAlphas[1]).toBeCloseTo(0.4, 4);
    expect(autoAlphas[2]).toBe(1.0);

    const solidAlphas = hardenCutoutAlpha(inAlphas, 'solid');
    expect(solidAlphas[0]).toBe(0);
    // In solid mode: 0.4 was hardened to ~0.555
    expect(solidAlphas[1]).toBeCloseTo(0.5555, 3);
    expect(solidAlphas[2]).toBe(1.0);
  });
});
