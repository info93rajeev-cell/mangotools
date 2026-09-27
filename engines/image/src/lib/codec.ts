import type { ResolvedImageFormat } from './formats.ts';

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
 * for WebP specifically. Any other failure propagates to the caller as a genuine encoding failure. Shared
 * by every operation in this engine that produces an image (Resize, Compress, Format Converter, Metadata
 * Remover, Watermark).
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
