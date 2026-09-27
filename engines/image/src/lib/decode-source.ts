import { err, ok, type Result } from '@mangotools/core';
import { decodeImage } from './codec.ts';
import type { ImageFile, ResolvedImageFormat } from './formats.ts';
import { MAX_SOURCE_MEGAPIXELS, MAX_SOURCE_PIXELS } from './limits.ts';
import { detectImageType, MIME_FOR_TYPE } from './signature.ts';

export interface DecodedSource {
  bitmap: ImageBitmap;
  sourceType: ResolvedImageFormat;
  width: number;
  height: number;
}

/**
 * Decodes `file` and checks its decoded pixel count against the shared source cap. Shared by every
 * operation in this engine that reads an image (Resize, Compress, Format Converter, Metadata Remover,
 * Watermark, Crop) — the one step every one of them needs before doing its own, different thing with
 * the result.
 */
export async function decodeAndCheckSource(file: ImageFile): Promise<Result<DecodedSource>> {
  const sourceType = detectImageType(file.bytes);
  if (!sourceType) return err('IMAGE_INVALID_FILE_TYPE', { details: { name: file.name } });
  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImage(file.bytes, MIME_FOR_TYPE[sourceType]);
  } catch {
    return err('IMAGE_UNREADABLE', { details: { name: file.name } });
  }
  if (bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) {
    bitmap.close();
    return err('IMAGE_SOURCE_PIXELS_TOO_LARGE', { details: { max: MAX_SOURCE_MEGAPIXELS } });
  }
  return ok({ bitmap, sourceType, width: bitmap.width, height: bitmap.height });
}
