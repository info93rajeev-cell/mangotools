import { err, ok, type Result } from '@mangotools/core';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../../lib/limits.ts';
import { detectImageType } from '../../lib/signature.ts';
import type { ImageCropInput } from './schema.ts';

function isValidPosition(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isValidSize(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Checks everything that does not require decoding the image: file presence, declared type (by
 * signature, not by extension or MIME claim), file size, and the crop rectangle's own shape (position
 * non-negative, size positive — both integers, pixels). Deliberately checked before decoding, the same
 * fail-fast-before-the-expensive-step discipline as `image.resize@1`/`image.watermark@1`. Whether the
 * rectangle actually *fits inside* the image can only be checked after decoding, once the real
 * dimensions are known — see `operation.ts`'s own `IMAGE_CROP_OUT_OF_BOUNDS` check.
 */
export function validateRequest(input: ImageCropInput): Result<null> {
  if (!input.file) return err('IMAGE_NO_FILE_SELECTED');
  if (!detectImageType(input.file.bytes)) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('IMAGE_FILE_TOO_LARGE', { details: { name: input.file.name, max: MAX_FILE_MB } });
  }
  if (!isValidPosition(input.cropX) || !isValidPosition(input.cropY)) {
    return err('IMAGE_CROP_POSITION_INVALID');
  }
  if (!isValidSize(input.cropWidth) || !isValidSize(input.cropHeight)) {
    return err('IMAGE_CROP_SIZE_INVALID');
  }
  return ok(null);
}
