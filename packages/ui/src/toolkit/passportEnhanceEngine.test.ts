import { describe, expect, it } from 'vitest';
import {
  applySpotCorrection,
  DEFAULT_ADJUSTMENTS,
  ZERO_ADJUSTMENTS,
} from './passportEnhanceEngine.ts';

describe('passportEnhanceEngine', () => {
  it('provides sensible default and zero adjustments', () => {
    expect(DEFAULT_ADJUSTMENTS.brightness).toBe(8);
    expect(DEFAULT_ADJUSTMENTS.contrast).toBe(6);
    expect(DEFAULT_ADJUSTMENTS.saturation).toBe(4);
    expect(DEFAULT_ADJUSTMENTS.sharpen).toBe(3);
    expect(DEFAULT_ADJUSTMENTS.reduceBlemishes).toBe(5);
    expect(DEFAULT_ADJUSTMENTS.skinSmooth).toBe(4);

    expect(ZERO_ADJUSTMENTS.brightness).toBe(0);
    expect(ZERO_ADJUSTMENTS.contrast).toBe(0);
    expect(ZERO_ADJUSTMENTS.saturation).toBe(0);
    expect(ZERO_ADJUSTMENTS.sharpen).toBe(0);
    expect(ZERO_ADJUSTMENTS.reduceBlemishes).toBe(0);
    expect(ZERO_ADJUSTMENTS.skinSmooth).toBe(0);
  });

  it('runs applySpotCorrection safely with mock CanvasRenderingContext2D', () => {
    const width = 30;
    const height = 30;
    const pixelData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < pixelData.length; i += 4) {
      pixelData[i] = 220; // R
      pixelData[i + 1] = 180; // G
      pixelData[i + 2] = 160; // B
      pixelData[i + 3] = 255; // A
    }

    const mockCtx = {
      canvas: { width, height },
      getImageData: (_sx: number, _sy: number, sw: number, sh: number) => ({
        data: pixelData.slice(0, sw * sh * 4),
        width: sw,
        height: sh,
      }),
      putImageData: () => {},
    } as unknown as CanvasRenderingContext2D;

    expect(() => {
      applySpotCorrection(mockCtx, 15, 15, 8, 0.7);
    }).not.toThrow();
  });
});
