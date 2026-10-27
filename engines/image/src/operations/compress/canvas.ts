import { enhancePhotoSharpness } from '../../lib/clarity.ts';
import { encodeCanvas } from '../../lib/codec.ts';
import type { ResolvedImageFormat } from '../../lib/formats.ts';

export interface RenderAndEncodeResult {
  bytes: Uint8Array;
  finalFormat: ResolvedImageFormat;
  fellBackFromWebp: boolean;
}

export async function renderAndEncodeCompress(
  bitmap: ImageBitmap,
  format: ResolvedImageFormat,
  width: number,
  height: number,
  quality: number,
  flattenToWhite: boolean,
): Promise<RenderAndEncodeResult> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  if (flattenToWhite) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);

  if (quality < 90 || width < bitmap.width || height < bitmap.height) {
    enhancePhotoSharpness(ctx, width, height, width < bitmap.width, quality);
  }

  const encoded = await encodeCanvas(canvas, format, quality / 100);
  const bytes = new Uint8Array(await encoded.blob.arrayBuffer());

  return {
    bytes,
    finalFormat: encoded.finalFormat,
    fellBackFromWebp: encoded.fellBackFromWebp,
  };
}
