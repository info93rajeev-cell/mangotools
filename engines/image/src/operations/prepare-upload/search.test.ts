import { describe, expect, it, vi } from 'vitest';
import { findUploadCandidate } from './search.ts';

const options = { width: 1000, height: 500, quality: 90, format: 'jpg' as const, reduce: false };

describe('bounded upload candidate search', () => {
  it.each([20, 50, 100, 200])('verifies the actual %i KB candidate bytes', async (kb) => {
    const maxBytes = kb * 1000;
    const encode = vi.fn(
      async (_width: number, _height: number, quality: number) =>
        new Uint8Array(quality === 90 ? maxBytes + 1 : maxBytes),
    );
    const result = await findUploadCandidate({ ...options, maxBytes }, encode);
    expect(result.met).toBe(true);
    expect(result.candidate.bytes.byteLength).toBe(maxBytes);
    expect(result.attempts).toBe(2);
    expect(encode.mock.calls[1][2]).toBeLessThan(90);
  });

  it('encodes exactly once without a target', async () => {
    const encode = vi.fn(async () => new Uint8Array(123));
    const result = await findUploadCandidate(options, encode);
    expect(result).toEqual({
      candidate: { bytes: new Uint8Array(123), width: 1000, height: 500 },
      attempts: 1,
      met: true,
    });
    expect(encode).toHaveBeenCalledOnce();
  });

  it('keeps dimensions fixed and selects the first verified fit despite non-monotonic sizes', async () => {
    const sizes = [5000, 6000, 2000, 4000];
    const encode = vi.fn(
      async (_width: number, _height: number, _quality: number) =>
        new Uint8Array(sizes.shift() ?? 8000),
    );
    const result = await findUploadCandidate({ ...options, maxBytes: 2500 }, encode);
    expect(result.candidate.bytes.byteLength).toBe(2000);
    expect(result.met).toBe(true);
    expect(result.attempts).toBe(3);
    expect(encode.mock.calls.every(([width, height]) => width === 1000 && height === 500)).toBe(
      true,
    );
    expect(result.candidate).toMatchObject({ width: 1000, height: 500 });
  });

  it('returns the smallest tested candidate without unauthorized dimension reduction', async () => {
    const sizes = [9000, 8000, 9500, 7000, 7500, 6000, 8500, 6500];
    const encode = vi.fn(
      async (_width: number, _height: number, _quality: number) =>
        new Uint8Array(sizes.shift() ?? 9999),
    );
    const result = await findUploadCandidate({ ...options, maxBytes: 1 }, encode);
    expect(result.met).toBe(false);
    expect(result.candidate.bytes.byteLength).toBe(6000);
    expect(result.attempts).toBe(8);
    expect(encode.mock.calls.every(([width, height]) => width === 1000 && height === 500)).toBe(
      true,
    );
    expect(encode.mock.calls.map((call) => call[2])).toEqual(expect.arrayContaining([90, 50]));
  });

  it('reduces dimensions only when enabled while preserving aspect and avoiding upscale', async () => {
    const encode = vi.fn(async (width: number, height: number) => new Uint8Array(width * height));
    const result = await findUploadCandidate(
      { ...options, reduce: true, maxBytes: 200000 },
      encode,
    );
    expect(result.met).toBe(true);
    expect(result.candidate.bytes.byteLength).toBeLessThanOrEqual(200000);
    expect(result.candidate.width).toBeLessThan(1000);
    expect(Math.abs(result.candidate.width - 2 * result.candidate.height)).toBeLessThanOrEqual(1);
    expect(encode.mock.calls.every(([width, height]) => width <= 1000 && height <= 500)).toBe(true);
    expect(result.attempts).toBeLessThanOrEqual(32);
  });

  it('bounds plateau search to four stages and 32 attempts', async () => {
    const encode = vi.fn(
      async (width: number, _height: number, _quality: number) =>
        new Uint8Array(width === 4096 ? 5000 : 9999),
    );
    const result = await findUploadCandidate(
      { ...options, width: 4096, height: 4096, reduce: true, maxBytes: 4000 },
      encode,
    );
    expect(result.met).toBe(false);
    expect(result.candidate).toMatchObject({
      bytes: new Uint8Array(5000),
      width: 4096,
      height: 4096,
    });
    expect(result.attempts).toBe(32);
    expect(encode).toHaveBeenCalledTimes(32);
    expect(new Set(encode.mock.calls.map(([width]) => width)).size).toBe(4);
    expect(
      encode.mock.calls.every(
        ([width, height, quality]) => width >= 64 && height >= 64 && quality >= 50,
      ),
    ).toBe(true);
  });

  it('stops at the short-side floor and ignores quality for PNG', async () => {
    const encode = vi.fn(async () => new Uint8Array(1000));
    const result = await findUploadCandidate(
      { ...options, width: 128, height: 64, format: 'png', reduce: true, maxBytes: 1 },
      encode,
    );
    expect(result).toMatchObject({
      attempts: 1,
      met: false,
      candidate: { width: 128, height: 64 },
    });
    expect(encode).toHaveBeenCalledOnce();
  });

  it('propagates encoder rejection for operation-level typed error mapping', async () => {
    await expect(
      findUploadCandidate(options, async () => {
        throw new Error('encode failed');
      }),
    ).rejects.toThrow('encode failed');
  });
});
