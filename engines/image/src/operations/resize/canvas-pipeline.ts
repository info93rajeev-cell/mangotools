import type { Dimensions } from './dimensions.ts';
import type { ResolvedImageFormat } from './schema.ts';

const ENCODE_MIME: Record<ResolvedImageFormat, 'image/jpeg' | 'image/png' | 'image/webp'> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const FORMAT_FOR_MIME: Record<string, ResolvedImageFormat> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Decodes raw bytes into a bitmap. Rejects (caller maps to `IMAGE_UNREADABLE`) for anything invalid. */
export function decodeImage(bytes: Uint8Array, mimeType: string): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([bytes as BlobPart], { type: mimeType }));
}

/**
 * Draws `bitmap` scaled to `output` onto a fresh canvas of exactly that size. When `flattenToWhite` is
 * set, the canvas is filled white first — otherwise a transparent source flattened to an opaque format
 * (JPG) would render solid black, a real canvas default, not a hypothetical (see README.md).
 */
export function renderResized(
  bitmap: ImageBitmap,
  output: Dimensions,
  flattenToWhite: boolean,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(output.width, output.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  if (flattenToWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, output.width, output.height);
  }
  ctx.drawImage(bitmap, 0, 0, output.width, output.height);
  return canvas;
}

export interface EncodeResult {
  blob: Blob;
  finalFormat: ResolvedImageFormat;
  /** True when the requested format could not be honored and PNG was used instead. */
  fellBackFromWebp: boolean;
}

/**
 * Encodes `canvas` as `requestedFormat`, falling back to PNG if — and only if — WebP was requested and
 * the browser cannot produce it. A browser may reject an unsupported type by throwing, or by silently
 * returning a blob whose `type` differs from what was asked for; both are treated as "not supported"
 * for WebP specifically. Any other failure propagates to the caller as a genuine encoding failure.
 */
export async function encodeCanvas(
  canvas: OffscreenCanvas,
  requestedFormat: ResolvedImageFormat,
  quality: number | undefined,
): Promise<EncodeResult> {
  try {
    const blob = await canvas.convertToBlob({ type: ENCODE_MIME[requestedFormat], quality });
    if (blob.type && blob.type !== ENCODE_MIME[requestedFormat]) {
      return { blob, finalFormat: FORMAT_FOR_MIME[blob.type] ?? 'png', fellBackFromWebp: true };
    }
    return { blob, finalFormat: requestedFormat, fellBackFromWebp: false };
  } catch (error) {
    if (requestedFormat !== 'webp') throw error;
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { blob, finalFormat: 'png', fellBackFromWebp: true };
  }
}
