import { err, ok, type Result } from '@mangotools/core';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../../lib/limits.ts';
import { detectImageType } from '../../lib/signature.ts';
import type { ImageCompressInput } from './schema.ts';

/**
 * Checks everything that does not require decoding the image: file presence,
 * declared type (by signature), and file size sanity.
 * Fails fast before allocating memory or decoding bitmaps.
 */
export function validateRequest(input: ImageCompressInput): Result<null> {
  if (!input.file) return err('IMAGE_NO_FILE_SELECTED');
  if (!detectImageType(input.file.bytes)) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('IMAGE_FILE_TOO_LARGE', { details: { name: input.file.name, max: MAX_FILE_MB } });
  }
  return ok(null);
}
