import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileImagesToPdf } from './imagePdfExport.ts';

describe('compileImagesToPdf', () => {
  const sampleJpg = readFileSync(
    join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg'),
  );

  it('compiles multiple images into a multi-page PDF', async () => {
    const res = await compileImagesToPdf({
      images: [
        { name: 'page1.jpg', bytes: new Uint8Array(sampleJpg), width: 8, height: 8 },
        { name: 'page2.jpg', bytes: new Uint8Array(sampleJpg), width: 8, height: 8 },
      ],
      pageSize: 'a4',
      orientation: 'portrait',
      margins: 'normal',
      fitMode: 'fit',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.pageCount).toBe(2);
      expect(res.value.pdfBytes.byteLength).toBeGreaterThan(500);
    }
  });

  it('handles landscape orientation and small margins', async () => {
    const res = await compileImagesToPdf({
      images: [{ name: 'landscape.jpg', bytes: new Uint8Array(sampleJpg), width: 16, height: 9 }],
      pageSize: 'letter',
      orientation: 'landscape',
      margins: 'small',
      fitMode: 'fill',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.pageCount).toBe(1);
    }
  });

  it('returns error when images array is empty', async () => {
    const res = await compileImagesToPdf({
      images: [],
    });

    expect(res.ok).toBe(false);
  });
});
