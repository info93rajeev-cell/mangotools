import { enhancePhotoSharpness, enhanceSignatureClarity } from '../../lib/clarity.ts';
import { encodeCanvas } from '../../lib/codec.ts';
import type { Dimensions } from '../resize/dimensions.ts';
import { type BoundingBox, calculatePaddedFittedBounds } from './ink.ts';
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
  inkBounds?: BoundingBox,
): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas context unavailable');
  if (input.outputFormat === 'jpg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (input.padToTarget) {
    const box = inkBounds ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const padded = calculatePaddedFittedBounds(box, { width, height });
    context.drawImage(
      bitmap,
      box.x,
      box.y,
      box.width,
      box.height,
      padded.destX,
      padded.destY,
      padded.destWidth,
      padded.destHeight,
    );
    const isUpscaled = padded.destWidth > box.width || padded.destHeight > box.height;
    enhanceSignatureClarity(context, width, height, input.outputFormat === 'jpg', isUpscaled);
  } else {
    const content = fittedDimensions(bitmap, { width, height });
    context.drawImage(
      bitmap,
      (width - content.width) / 2,
      (height - content.height) / 2,
      content.width,
      content.height,
    );
    const isDownscaled = content.width < bitmap.width || content.height < bitmap.height;
    enhancePhotoSharpness(context, width, height, isDownscaled, quality);
  }

  const encoded = await encodeCanvas(canvas, input.outputFormat, quality / 100);
  if (encoded.finalFormat !== input.outputFormat)
    throw new Error('Requested output format unavailable');
  return new Uint8Array(await encoded.blob.arrayBuffer());
}
