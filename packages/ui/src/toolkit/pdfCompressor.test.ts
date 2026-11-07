import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  compressPdf,
  compressToTarget,
  findJpegImages,
  reductionPercent,
  scaledSize,
  settingsFor,
  tighter,
} from './pdfCompressor.ts';

/** A minimal valid baseline JPEG (8x8 grey) padded past the size threshold with a COM segment. */
function bigJpeg(): Uint8Array {
  const head = [0xff, 0xd8, 0xff, 0xfe, 0x7f, 0xff];
  const comment = new Array(0x7ffd).fill(0x20);
  const tiny = [
    0xff,
    0xdb,
    0x00,
    0x43,
    0x00,
    ...new Array(64).fill(1),
    0xff,
    0xc0,
    0x00,
    0x0b,
    0x08,
    0x00,
    0x08,
    0x00,
    0x08,
    0x01,
    0x01,
    0x11,
    0x00,
    0xff,
    0xc4,
    0x00,
    0x14,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0xff,
    0xc4,
    0x00,
    0x14,
    0x10,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0xff,
    0xda,
    0x00,
    0x08,
    0x01,
    0x01,
    0x00,
    0x00,
    0x3f,
    0x00,
    0x00,
    0xff,
    0xd9,
  ];
  return new Uint8Array([...head, ...comment, ...tiny]);
}

async function textPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage().drawText('Hello', { x: 50, y: 700, size: 12, font });
  return doc.save({ useObjectStreams: false });
}

describe('pdfCompressor', () => {
  it('maps presets to real encoder settings', () => {
    expect(settingsFor('balanced', 10, false, true)).toEqual({
      quality: 0.7,
      maxDimension: 2000,
      grayscale: false,
      removeThumbnails: true,
    });
    expect(settingsFor('custom', 45, true, false).quality).toBe(0.45);
    expect(settingsFor('custom', 0, true, false).quality).toBe(0.1);
  });

  it('scales the longest side down, never up', () => {
    expect(scaledSize(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(scaledSize(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });

  it('tightens settings for a size target within limits', () => {
    const t = tighter({
      quality: 0.5,
      maxDimension: 1000,
      grayscale: false,
      removeThumbnails: true,
    });
    expect(t.quality).toBe(0.38);
    expect(t.maxDimension).toBe(800);
    expect(tighter(t).quality).toBe(0.3);
  });

  it('never overstates a reduction', () => {
    expect(reductionPercent(1000, 299)).toBe(70);
    expect(reductionPercent(1000, 1000)).toBe(0);
    expect(reductionPercent(1000, 1200)).toBe(0);
    expect(reductionPercent(0, 0)).toBe(0);
  });

  it('finds JPEG image streams above the size threshold', async () => {
    const doc = await PDFDocument.create();
    const img = await doc.embedJpg(bigJpeg());
    doc.addPage().drawImage(img, { x: 0, y: 0, width: 8, height: 8 });
    const loaded = await PDFDocument.load(await doc.save());
    const found = findJpegImages(loaded);
    expect(found).toHaveLength(1);
    expect(found[0]?.width).toBe(8);
  });

  it('keeps the original when nothing can be saved, and reports no images', async () => {
    const input = await textPdf();
    const r = await compressPdf(input, settingsFor('balanced', 70, false, true));
    expect(r.imagesFound).toBe(0);
    expect(r.pageCount).toBe(1);
    expect(r.compressedBytes).toBeLessThanOrEqual(r.originalBytes);
    if (r.noGain) expect(r.bytes).toBe(input);
  });

  it('does not retry a size target when there are no images to shrink', async () => {
    const r = await compressToTarget(await textPdf(), settingsFor('strong', 50, false, true), 10);
    expect(r.attempts).toBe(1);
    expect(r.targetMet).toBe(false);
  });
});
