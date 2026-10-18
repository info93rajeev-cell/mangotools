import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';
import { fittedDimensions } from './canvas.ts';
import { imagePrepareUpload } from './operation.ts';
import { uploadInput } from './schema.ts';

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const base = { targetWidth: 200, targetHeight: 100, outputFormat: 'jpg' };
const file = { name: 'synthetic.png', bytes: png };
const run = (extra: Record<string, unknown>) =>
  executeOperation(imagePrepareUpload, { ...base, ...extra }, {}, createTestContext());

describe('upload preparation contract (synthetic, hand-verified)', () => {
  it('defaults to aspect-safe quality 90 with no hidden target or downscale permission', () => {
    expect(uploadInput.parse(base)).toEqual({
      ...base,
      keepAspectRatio: true,
      quality: 90,
      padToTarget: false,
      allowDimensionReduction: false,
    });
    expect(imagePrepareUpload.runtimes).toEqual(['worker']);
  });

  it.each([
    { keepAspectRatio: false },
    { outputFormat: 'webp' },
    { quality: 49 },
    { quality: 101 },
    { maxFileSizeKB: 0 },
    { maxFileSizeKB: 1.5 },
    { maxFileSizeKB: 25001 },
    { padToTarget: true, allowDimensionReduction: true },
    { unknown: true },
  ])('rejects unsupported configuration %j', (extra) => {
    expect(uploadInput.safeParse({ ...base, ...extra }).success).toBe(false);
  });

  it.each([
    [{}, 'IMAGE_NO_FILE_SELECTED'],
    [{ file: { ...file, bytes: new Uint8Array(0) } }, 'IMAGE_INVALID_FILE_TYPE'],
    [{ file, targetWidth: 0 }, 'IMAGE_DIMENSIONS_INVALID'],
    [{ file, targetHeight: 20001 }, 'IMAGE_DIMENSIONS_INVALID'],
    [
      { file, targetWidth: 10000, targetHeight: 10000, padToTarget: true },
      'IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE',
    ],
    [{ file }, 'IMAGE_UNREADABLE'],
  ])('returns typed pre-canvas validation for %j', async (extra, code) => {
    expect(await run(extra)).toMatchObject({ ok: false, error: { code } });
  });

  it('rejects excessive raw bytes before attempting decode', async () => {
    const bytes = new Uint8Array(MAX_FILE_BYTES + 1);
    bytes.set(png);
    expect(await run({ file: { ...file, bytes } })).toMatchObject({
      ok: false,
      error: { code: 'IMAGE_FILE_TOO_LARGE' },
    });
  });

  it('contains without stretching or upscaling even for mismatched and extreme ratios', () => {
    expect(fittedDimensions({ width: 400, height: 100 }, { width: 200, height: 100 })).toEqual({
      width: 200,
      height: 50,
    });
    expect(fittedDimensions({ width: 40, height: 10 }, { width: 200, height: 100 })).toEqual({
      width: 40,
      height: 10,
    });
    expect(fittedDimensions({ width: 20000, height: 1 }, { width: 1, height: 1 })).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('catalogues all operation errors and the size-reduction warning', () => {
    for (const code of imagePrepareUpload.errors.filter((code) => code !== 'ABORTED'))
      expect(messages[code], code).toBeTruthy();
    expect(messages.IMAGE_DIMENSIONS_REDUCED).toBeTruthy();
  });
});
