/**
 * Page options for JPG → PDF that act on each image or page: rotation (the user's turns plus the
 * camera's EXIF orientation), page numbers, page background and image quality.
 * Everything runs in the browser; nothing is uploaded.
 */

export type PageNumbering = 'none' | 'bottom-center' | 'bottom-right';
export type PageBackground = 'white' | 'transparent' | 'offwhite';
export type ImageQuality = 'high' | 'medium' | 'low';

export interface PageExtras {
  numbering: PageNumbering;
  background: PageBackground;
  quality: ImageQuality;
}

export const DEFAULT_PAGE_EXTRAS: PageExtras = {
  numbering: 'none',
  background: 'white',
  quality: 'high',
};

/** Off-white page colour (RGB 0–1), the same warm white print shops call "ivory". */
export const OFFWHITE_RGB = [0.98, 0.976, 0.965] as const;

const EXIF_ROTATION: Record<number, number> = { 3: 180, 6: 90, 8: 270 };

function readU16(view: DataView, at: number, little: boolean): number {
  return view.getUint16(at, little);
}

/** The clockwise rotation (0/90/180/270) a JPEG's EXIF Orientation tag asks for; 0 if none. */
export function exifRotation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || readU16(view, 0, false) !== 0xffd8) return 0;
  let at = 2;
  while (at + 4 <= bytes.length) {
    const marker = readU16(view, at, false);
    const size = readU16(view, at + 2, false);
    if (marker === 0xffe1 && at + 10 <= bytes.length && view.getUint32(at + 4) === 0x45786966) {
      return orientationFromTiff(view, at + 10);
    }
    if ((marker & 0xff00) !== 0xff00 || size < 2) return 0;
    at += 2 + size;
  }
  return 0;
}

function orientationFromTiff(view: DataView, tiff: number): number {
  if (tiff + 8 > view.byteLength) return 0;
  const little = readU16(view, tiff, false) === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > view.byteLength) return 0;
  const count = readU16(view, ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) return 0;
    if (readU16(view, entry, little) === 0x0112) {
      return EXIF_ROTATION[readU16(view, entry + 8, little)] ?? 0;
    }
  }
  return 0;
}

const QUALITY: Record<Exclude<ImageQuality, 'high'>, { maxSide: number; jpeg: number }> = {
  medium: { maxSide: 2000, jpeg: 0.75 },
  low: { maxSide: 1400, jpeg: 0.55 },
};

/**
 * Re-encodes an image as a smaller JPEG for "Medium" and "Low" quality. The browser applies the
 * EXIF orientation while decoding, so the result needs no further EXIF rotation. Returns null when
 * the browser cannot decode the image (the caller keeps the original).
 */
export async function reencodeForQuality(
  bytes: Uint8Array,
  quality: Exclude<ImageQuality, 'high'>,
): Promise<Uint8Array | null> {
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined')
    return null;
  try {
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart]));
    const { maxSide, jpeg } = QUALITY[quality];
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpeg });
    return new Uint8Array(await blob.arrayBuffer());
  } catch {
    return null;
  }
}

/** Where the image goes when it is drawn turned by `rotation` degrees clockwise into a box. */
export function rotatedPlacement(
  box: { x: number; y: number; width: number; height: number },
  rotation: number,
): { x: number; y: number; width: number; height: number; degrees: number } {
  const r = ((rotation % 360) + 360) % 360;
  if (r === 90)
    return { x: box.x, y: box.y + box.height, width: box.height, height: box.width, degrees: -90 };
  if (r === 180) {
    return {
      x: box.x + box.width,
      y: box.y + box.height,
      width: box.width,
      height: box.height,
      degrees: -180,
    };
  }
  if (r === 270)
    return { x: box.x + box.width, y: box.y, width: box.height, height: box.width, degrees: -270 };
  return { ...box, degrees: 0 };
}

/** The page-number label and its x position for one page. */
export function pageNumberLabel(
  index: number,
  total: number,
  numbering: PageNumbering,
  pageWidth: number,
  textWidth: (text: string) => number,
): { text: string; x: number } | null {
  if (numbering === 'none') return null;
  const text = `${index + 1} / ${total}`;
  const width = textWidth(text);
  const x = numbering === 'bottom-center' ? (pageWidth - width) / 2 : pageWidth - width - 24;
  return { text, x };
}
