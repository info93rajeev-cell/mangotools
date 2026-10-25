import { describe, expect, it } from 'vitest';
import {
  AUTO_ENHANCE_PRESET,
  applyColorGrading,
  applySharpness,
  DEFAULT_ENHANCEMENT,
} from './imageEnhancementPipeline.ts';

describe('imageEnhancementPipeline', () => {
  it('applies unsharp masking correctly to edge pixels', () => {
    const w = 4;
    const h = 4;
    const data = new Uint8ClampedArray(w * h * 4);
    // Fill background with 100
    data.fill(100);
    // Set a bright center pixel at (2, 2)
    const centerIdx = (2 * w + 2) * 4;
    data[centerIdx] = 200;
    data[centerIdx + 1] = 200;
    data[centerIdx + 2] = 200;

    applySharpness(data, w, h, 50);

    // Center pixel contrast should be enhanced compared to neighbours
    expect(data[centerIdx]).toBeGreaterThan(200);
  });

  it('preserves pixel data when sharpness is 0', () => {
    const w = 4;
    const h = 4;
    const data = new Uint8ClampedArray(w * h * 4).fill(128);
    const original = new Uint8ClampedArray(data);

    applySharpness(data, w, h, 0);

    expect(data).toEqual(original);
  });

  it('adjusts contrast, brightness, vibrance and warmth in color grading', () => {
    const data = new Uint8ClampedArray([100, 120, 140, 255]);

    applyColorGrading(data, {
      scale: 1,
      sharpness: 0,
      contrast: 20,
      brightness: 10,
      vibrance: 30,
      warmth: 15,
    });

    // Warmth boosts red and reduces blue
    expect(data[0]).toBeGreaterThan(100);
    expect(data[2]).toBeLessThan(170);
  });

  it('has valid default and auto-enhance presets', () => {
    expect(DEFAULT_ENHANCEMENT.scale).toBe(2);
    expect(AUTO_ENHANCE_PRESET.sharpness).toBeGreaterThan(DEFAULT_ENHANCEMENT.sharpness);
    expect(AUTO_ENHANCE_PRESET.vibrance).toBeGreaterThan(DEFAULT_ENHANCEMENT.vibrance);
  });
});
