import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { ROOT } from '../../scripts/lib/paths.ts';
import { bundleTestEntry } from '../support/library-bundle.ts';
import { runOperationWorker } from '../support/operation-worker.ts';

interface Observation {
  ok: boolean;
  error?: string;
  hasValue?: boolean;
  width?: number;
  height?: number;
  bytes?: number;
  reportedBytes?: number;
  target?: number | null;
  attempts?: number;
  format?: string;
  pixels?: number[][];
}

test('upload preparation verifies real worker bytes, padding, scaling and typed failures', async ({
  page,
}) => {
  const bundle = await bundleTestEntry(
    '@mangotools/engine-image',
    join(ROOT, 'engines/image'),
    `
    import { imagePrepareUpload } from '@mangotools/engine-image';
    import { executeOperation, createTestContext } from '@mangotools/core';
    async function source(width, height, noisy = false) {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (noisy) {
        const pixels = new Uint8ClampedArray(createTestContext({ seed: 37 }).random(width * height * 4));
        for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
        context.putImageData(new ImageData(pixels, width, height), 0, 0);
      } else context.fillRect(0, 0, width * 0.75, height);
      return { name: 'source.png', bytes: new Uint8Array(await (await canvas.convertToBlob()).arrayBuffer()) };
    }
    async function observe(input, signal = { aborted: false }) {
      const context = { ...createTestContext(), signal };
      const result = await executeOperation(imagePrepareUpload, input, {}, context);
      if (!result.ok) return { ok: false, error: result.error.code, hasValue: Object.hasOwn(result, 'value') };
      const value = result.value;
      const bitmap = await createImageBitmap(new Blob([value.bytes]));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const pixels = canvas.getContext('2d');
      pixels.drawImage(bitmap, 0, 0);
      const observed = {
        ok: true, width: bitmap.width, height: bitmap.height, bytes: value.bytes.byteLength,
        reportedBytes: value.outputFileSize, target: value.targetFileSizeBytes, attempts: value.encodeAttempts,
        format: value.bytes[0] === 255 && value.bytes[1] === 216 ? 'jpg' : value.bytes[0] === 137 ? 'png' : 'unknown',
        pixels: [[0, 0], [4, 20], [34, 20], [50, 20], [96, 20]].map(([x, y]) => Array.from(pixels.getImageData(x, y, 1, 1).data)),
      };
      if (bitmap.width !== value.outputWidth || bitmap.height !== value.outputHeight) throw new Error('Reported dimensions differ');
      bitmap.close();
      return observed;
    }
    export async function run() {
      const photo = await source(512, 256, true);
      const signature = await source(32, 8);
      const base = { file: photo, targetWidth: 512, targetHeight: 256, outputFormat: 'jpg' };
      const rows = {};
      for (const kb of [20, 50, 100, 200]) rows['kb' + kb] = await observe({ ...base, maxFileSizeKB: kb, allowDimensionReduction: true });
      rows.fixed = await observe({ ...base, maxFileSizeKB: 200 });
      rows.pngReduced = await observe({ ...base, outputFormat: 'png', maxFileSizeKB: 50, allowDimensionReduction: true });
      for (const outputFormat of ['jpg', 'png']) rows[outputFormat] = await observe({ ...base, file: signature, targetWidth: 100, targetHeight: 40, padToTarget: true, outputFormat });
      rows.small = await observe({ ...base, file: signature, targetWidth: 100, targetHeight: 100 });
      rows.unreachable = await observe({ ...base, outputFormat: 'png', padToTarget: true, maxFileSizeKB: 1 });
      rows.corrupt = await observe({ ...base, file: { name: 'bad.jpg', bytes: new Uint8Array([255, 216, 255]) } });
      rows.limit = await observe({ ...base, padToTarget: true, targetWidth: 10000, targetHeight: 10000 });
      rows.cancelled = await observe({ ...base, file: signature }, { aborted: true });
      const controller = new AbortController();
      const originalEncode = OffscreenCanvas.prototype.convertToBlob;
      OffscreenCanvas.prototype.convertToBlob = async function(options) {
        const blob = await originalEncode.call(this, options);
        controller.abort();
        return blob;
      };
      try { rows.duringEncode = await observe({ ...base, file: signature }, controller.signal); }
      finally { OffscreenCanvas.prototype.convertToBlob = originalEncode; }
      return rows;
    }`,
    'UnpublishedOperationHarness',
  );
  const rows = (await runOperationWorker(page, bundle, [])) as Record<string, Observation>;
  for (const kb of [20, 50, 100, 200]) {
    const row = rows[`kb${kb}`];
    expect(row.ok).toBe(true);
    expect(row.bytes).toBeLessThanOrEqual(kb * 1000);
    expect(row.reportedBytes).toBe(row.bytes);
    expect(row.target).toBe(kb * 1000);
    expect(row.attempts).toBeLessThanOrEqual(32);
    expect(row.format).toBe('jpg');
  }
  expect(rows.kb20.width).toBeLessThan(512);
  expect(Math.abs((rows.kb20.width ?? 0) - 2 * (rows.kb20.height ?? 0))).toBeLessThanOrEqual(1);
  expect(rows.fixed).toMatchObject({ ok: true, width: 512, height: 256 });
  expect(rows.pngReduced).toMatchObject({ ok: true, format: 'png' });
  expect(rows.pngReduced.bytes).toBeLessThanOrEqual(50000);
  expect(rows.small).toMatchObject({ ok: true, width: 32, height: 8, target: null });
  for (const format of ['jpg', 'png'])
    expect(rows[format]).toMatchObject({ ok: true, width: 100, height: 40, format });
  expect(rows.png.pixels).toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 0],
  ]);
  expect(rows.jpg.pixels?.[0].slice(0, 3).every((channel) => channel >= 250)).toBe(true);
  expect(rows.jpg.pixels?.[3].slice(0, 3).every((channel) => channel <= 10)).toBe(true);
  expect(rows.jpg.pixels?.[4].slice(0, 3).every((channel) => channel >= 250)).toBe(true);
  for (const [id, error] of Object.entries({
    unreachable: 'IMAGE_SIZE_TARGET_UNREACHABLE',
    corrupt: 'IMAGE_UNREADABLE',
    limit: 'IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE',
    cancelled: 'ABORTED',
    duringEncode: 'ABORTED',
  })) {
    expect(rows[id]).toEqual({ ok: false, error, hasValue: false });
  }
});
