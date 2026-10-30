import { describe, expect, it } from 'vitest';
import {
  formatImageBytes,
  getStrictMaxFileSizeBytes,
  getStrictMinFileSizeBytes,
} from './imageSizeFormat.ts';

describe('imageSizeFormat', () => {
  it('formats zero and negative bytes cleanly', () => {
    expect(formatImageBytes(0)).toBe('0 B');
    expect(formatImageBytes(-100)).toBe('0 B');
  });

  it('formats byte, kilobyte, and megabyte magnitudes correctly', () => {
    expect(formatImageBytes(512)).toBe('512 B');
    expect(formatImageBytes(1024)).toBe('1.0 KB');
    expect(formatImageBytes(51200)).toBe('50 KB');
    expect(formatImageBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatImageBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('computes dual-standard strict max bytes using 1000 bytes/KB', () => {
    // 200 KB target: 200 * 1000 = 200,000 bytes (< 204,800 bytes)
    // Ensures upload portals measuring in metric decimal never reject the file
    expect(getStrictMaxFileSizeBytes(200)).toBe(200000);
    expect(getStrictMaxFileSizeBytes(50)).toBe(50000);
    expect(getStrictMaxFileSizeBytes(20)).toBe(20000);
  });

  it('computes dual-standard strict min bytes using 1024 bytes/KB', () => {
    // 50 KB min limit: 50 * 1024 = 51,200 bytes (> 50,000 bytes)
    // Ensures upload portals requiring at least 50KB never reject for being undersized
    expect(getStrictMinFileSizeBytes(50)).toBe(51200);
    expect(getStrictMinFileSizeBytes(20)).toBe(20480);
  });
});
