import { err, ok, type Result } from '@mangotools/core';
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_FILE_MB,
  MAX_TOTAL_BYTES,
  MAX_TOTAL_MB,
} from './limits.ts';
import type { JpgFile } from './schema.ts';
import { hasJpegSignature } from './signature.ts';

/**
 * Checks image count, then each image's size and type, then the combined total — all before any
 * image is decoded, so an image that is simply too big or the wrong type never reaches `pdf-lib`.
 */
export function validateFiles(files: readonly JpgFile[]): Result<null> {
  if (files.length === 0) return err('PDF_JPG_NO_FILES_SELECTED');
  if (files.length > MAX_FILE_COUNT)
    return err('PDF_JPG_TOO_MANY_FILES', { details: { max: MAX_FILE_COUNT } });
  let total = 0;
  for (const [index, file] of files.entries()) {
    if (file.bytes.byteLength > MAX_FILE_BYTES) {
      return err('PDF_JPG_FILE_TOO_LARGE', {
        path: `files.${index}`,
        details: { name: file.name, max: MAX_FILE_MB },
      });
    }
    if (!hasJpegSignature(file.bytes)) {
      return err('PDF_JPG_INVALID_FILE_TYPE', {
        path: `files.${index}`,
        details: { name: file.name },
      });
    }
    total += file.bytes.byteLength;
  }
  if (total > MAX_TOTAL_BYTES)
    return err('PDF_JPG_TOTAL_SIZE_EXCEEDED', { details: { max: MAX_TOTAL_MB } });
  return ok(null);
}
