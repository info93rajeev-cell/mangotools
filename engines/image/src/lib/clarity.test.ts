import { describe, expect, it } from 'vitest';
import { applyUnsharpMask } from './clarity.ts';

describe('clarity unsharp mask', () => {
  it('enhances edge contrast when amount > 0', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);
    // Background is 100
    data.fill(100);
    // Set an edge/contrast center pixel at (2, 2)
    const centerIdx = (2 * width + 2) * 4;
    data[centerIdx] = 200;
    data[centerIdx + 1] = 200;
    data[centerIdx + 2] = 200;
    data[centerIdx + 3] = 255;

    applyUnsharpMask(data, width, height, 50);

    // Center pixel contrast should be enhanced compared to neighbours
    expect(data[centerIdx]).toBeGreaterThan(200);
  });

  it('preserves data untouched when amount is 0', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4).fill(128);
    const original = new Uint8ClampedArray(data);

    applyUnsharpMask(data, width, height, 0);

    expect(data).toEqual(original);
  });

  it('skips transparent pixels', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);
    // All transparent (alpha = 0)
    data[0] = 50;
    data[1] = 50;
    data[2] = 50;
    data[3] = 0;

    applyUnsharpMask(data, width, height, 50);

    expect(data[3]).toBe(0);
  });
});
