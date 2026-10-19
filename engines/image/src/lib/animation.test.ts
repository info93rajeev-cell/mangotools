import { describe, expect, it } from 'vitest';
import { isAnimatedImage } from './animation.ts';

describe('isAnimatedImage', () => {
  it('returns false for non-image or short bytes', () => {
    expect(isAnimatedImage(new Uint8Array([]))).toBe(false);
    expect(isAnimatedImage(new Uint8Array([1, 2, 3, 4]))).toBe(false);
  });

  it('returns false for static JPEG', () => {
    const jpg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    expect(isAnimatedImage(jpg)).toBe(false);
  });

  it('returns false for static PNG without acTL', () => {
    // PNG signature + IHDR chunk (13 bytes) + IDAT chunk (0 bytes) + IEND chunk (0 bytes)
    const png = new Uint8Array([
      // Signature (8 bytes)
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      // IHDR: length 13
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52, // 'IHDR'
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      8,
      2,
      0,
      0,
      0, // 1x1 image data
      0,
      0,
      0,
      0, // CRC
      // IDAT: length 0
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x44,
      0x41,
      0x54, // 'IDAT'
      0,
      0,
      0,
      0, // CRC
      // IEND
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x45,
      0x4e,
      0x44,
      0xae,
      0x42,
      0x60,
      0x82,
    ]);
    expect(isAnimatedImage(png)).toBe(false);
  });

  it('returns true for APNG containing acTL before IDAT', () => {
    // PNG signature + IHDR + acTL + IDAT
    const apng = new Uint8Array([
      // Signature (8 bytes)
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      // IHDR: length 13
      0x00,
      0x00,
      0x00,
      0x0d,
      0x49,
      0x48,
      0x44,
      0x52,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1,
      8,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // acTL: length 8 (num_frames: 2, num_plays: 0)
      0x00,
      0x00,
      0x00,
      0x08,
      0x61,
      0x63,
      0x54,
      0x4c, // 'acTL'
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // CRC
      // IDAT
      0x00,
      0x00,
      0x00,
      0x00,
      0x49,
      0x44,
      0x41,
      0x54,
      0,
      0,
      0,
      0,
    ]);
    expect(isAnimatedImage(apng)).toBe(true);
  });

  it('returns false for static WebP (VP8)', () => {
    // RIFF (4) + size (4) + WEBP (4) + VP8_ (4) + size (4) + data
    const webp = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x1c,
      0x00,
      0x00,
      0x00, // 28 bytes
      0x57,
      0x45,
      0x42,
      0x50, // 'WEBP'
      0x56,
      0x50,
      0x38,
      0x20, // 'VP8 '
      0x04,
      0x00,
      0x00,
      0x00, // 4 bytes chunk
      0,
      0,
      0,
      0,
    ]);
    expect(isAnimatedImage(webp)).toBe(false);
  });

  it('returns false for static WebP Extended (VP8X without animation flag)', () => {
    const webp = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x20,
      0x00,
      0x00,
      0x00,
      0x57,
      0x45,
      0x42,
      0x50, // 'WEBP'
      0x56,
      0x50,
      0x38,
      0x58, // 'VP8X'
      0x0a,
      0x00,
      0x00,
      0x00, // 10 bytes chunk
      0x00, // flags: animation bit 1 is 0
      0x00,
      0x00,
      0x00, // reserved
      0x01,
      0x00,
      0x00, // canvas width minus 1
      0x01,
      0x00,
      0x00, // canvas height minus 1
    ]);
    expect(isAnimatedImage(webp)).toBe(false);
  });

  it('returns true for animated WebP Extended (VP8X with animation flag 0x02)', () => {
    const animWebp = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x20,
      0x00,
      0x00,
      0x00,
      0x57,
      0x45,
      0x42,
      0x50, // 'WEBP'
      0x56,
      0x50,
      0x38,
      0x58, // 'VP8X'
      0x0a,
      0x00,
      0x00,
      0x00, // 10 bytes chunk
      0x02, // flags: animation bit 1 is 1!
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
    ]);
    expect(isAnimatedImage(animWebp)).toBe(true);
  });

  it('returns true for WebP containing ANIM chunk', () => {
    const animWebp = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46,
      0x20,
      0x00,
      0x00,
      0x00,
      0x57,
      0x45,
      0x42,
      0x50,
      0x41,
      0x4e,
      0x49,
      0x4d, // 'ANIM'
      0x06,
      0x00,
      0x00,
      0x00,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
    expect(isAnimatedImage(animWebp)).toBe(true);
  });
});
