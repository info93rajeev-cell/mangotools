import { err, ok, type Result } from '@mangotools/core';
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  MAX_FILE_MB,
  MAX_TOTAL_BYTES,
  MAX_TOTAL_MB,
} from './limits.ts';
import type { PdfFile } from './schema.ts';
import { hasPdfSignature } from './signature.ts';

/**
 * Checks file count, then each file's size and type, then the combined total — all before any
 * file is parsed, so a file that is simply too big or the wrong type never reaches `pdf-lib`.
 */
export function validateFiles(files: readonly PdfFile[]): Result<null> {
  if (files.length === 0) return err('PDF_NO_FILES_SELECTED');
  if (files.length > MAX_FILE_COUNT)
    return err('PDF_TOO_MANY_FILES', { details: { max: MAX_FILE_COUNT } });
  let total = 0;
  for (const [index, file] of files.entries()) {
    if (file.bytes.byteLength > MAX_FILE_BYTES) {
      return err('PDF_FILE_TOO_LARGE', {
        path: `files.${index}`,
        details: { name: file.name, max: MAX_FILE_MB },
      });
    }
    if (!hasPdfSignature(file.bytes)) {
      return err('PDF_INVALID_FILE_TYPE', { path: `files.${index}`, details: { name: file.name } });
    }
    total += file.bytes.byteLength;
  }
  if (total > MAX_TOTAL_BYTES)
    return err('PDF_TOTAL_SIZE_EXCEEDED', { details: { max: MAX_TOTAL_MB } });
  return ok(null);
}
