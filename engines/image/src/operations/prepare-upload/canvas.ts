import { encodeCanvas } from '../../lib/codec.ts';
import type { Dimensions } from '../resize/dimensions.ts';
import type { UploadInput } from './schema.ts';

/** Contain without upscaling. Padding changes the canvas, not the signature's proportions. */
export function fittedDimensions(bitmap: Dimensions, target: Dimensions): Dimensions {
  const scale = Math.min(1, target.width / bitmap.width, target.height / bitmap.height);
  return {
    width: Math.max(1, Math.round(bitmap.width * scale)),
    height: Math.max(1, Math.round(bitmap.height * scale)),
  };
}

export async function encodePrepared(
  bitmap: ImageBitmap,
  input: UploadInput,
  width: number,
  height: number,
  quality: number,
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas context unavailable');
  if (input.outputFormat === 'jpg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  const content = fittedDimensions(bitmap, { width, height });
  context.drawImage(
    bitmap,
    (width - content.width) / 2,
    (height - content.height) / 2,
    content.width,
    content.height,
  );
  const encoded = await encodeCanvas(canvas, input.outputFormat, quality / 100);
  if (encoded.finalFormat !== input.outputFormat)
    throw new Error('Requested output format unavailable');
  return new Uint8Array(await encoded.blob.arrayBuffer());
}
