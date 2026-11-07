import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { compileImagesToPdf } from './imagePdfExport.ts';
import { exifRotation, pageNumberLabel, rotatedPlacement } from './imagePdfPageOptions.ts';

const file = (name: string) =>
  new Uint8Array(readFileSync(join(process.cwd(), 'tools/jpg-to-pdf/fixtures/files', name)));
const wide = file('wide-40x20.jpg');
const wideExif90 = file('wide-40x20-exif-rotate-90.jpg');

async function pages(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())]);
}

describe('JPG to PDF page options', () => {
  it('reads the EXIF orientation a phone camera writes', () => {
    expect(exifRotation(wide)).toBe(0);
    expect(exifRotation(wideExif90)).toBe(90);
  });

  it('a 90° turn makes a 40×20 image a 20×40 page ("Fit to image")', async () => {
    const res = await compileImagesToPdf({
      images: [
        { name: 'a.jpg', bytes: wide, rotation: 0 },
        { name: 'b.jpg', bytes: wide, rotation: 90 },
        { name: 'c.jpg', bytes: wide, rotation: 180 },
      ],
      pageSize: 'fit',
    });
    if (!res.ok) throw new Error(res.error.code);
    expect(await pages(res.value.pdfBytes)).toEqual([
      [40, 20],
      [20, 40],
      [40, 20],
    ]);
  });

  it('honours the EXIF orientation, so phone photos are not sideways', async () => {
    const res = await compileImagesToPdf({
      images: [{ name: 'phone.jpg', bytes: wideExif90 }],
      pageSize: 'fit',
    });
    if (!res.ok) throw new Error(res.error.code);
    expect(await pages(res.value.pdfBytes)).toEqual([[20, 40]]);
  });

  it('places a rotated image exactly inside its box', () => {
    const box = { x: 10, y: 20, width: 100, height: 50 };
    expect(rotatedPlacement(box, 90)).toEqual({
      x: 10,
      y: 70,
      width: 50,
      height: 100,
      degrees: -90,
    });
    expect(rotatedPlacement(box, 270)).toEqual({
      x: 110,
      y: 20,
      width: 50,
      height: 100,
      degrees: -270,
    });
  });

  it('numbers pages "1 / 3" centred or at the right', () => {
    const w = () => 20;
    expect(pageNumberLabel(0, 3, 'bottom-center', 600, w)).toEqual({ text: '1 / 3', x: 290 });
    expect(pageNumberLabel(2, 3, 'bottom-right', 600, w)).toEqual({ text: '3 / 3', x: 556 });
    expect(pageNumberLabel(0, 3, 'none', 600, w)).toBeNull();
  });

  it('adds page numbers and an off-white background without failing', async () => {
    const res = await compileImagesToPdf({
      images: [
        { name: 'a.jpg', bytes: wide },
        { name: 'b.jpg', bytes: wide },
      ],
      extras: { numbering: 'bottom-center', background: 'offwhite', quality: 'high' },
    });
    expect(res.ok && res.value.pageCount).toBe(2);
  });
});
