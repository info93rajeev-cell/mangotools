import { err, ok, type Result } from '@mangotools/core';
import { hasPdfSignature } from '../../lib/signature.ts';
import { MAX_FILE_BYTES, MAX_FILE_MB } from './limits.ts';
import type { PdfSplitInput } from './schema.ts';

function isValidPageNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/**
 * Checks everything that does not require parsing the PDF: file presence, declared type (by
 * signature, not by extension or claimed MIME type), file size, and the page range's own shape
 * (both bounds positive integers, end not before start). Deliberately checked before parsing, the
 * same fail-fast-before-the-expensive-step discipline as `pdf.merge@1`. Whether the range actually
 * *fits inside* the PDF can only be checked after parsing, once the real page count is known — see
 * `operation.ts`'s own `PDF_SPLIT_RANGE_EXCEEDS_PAGE_COUNT` check.
 */
export function validateRequest(input: PdfSplitInput): Result<null> {
  if (!input.file) return err('PDF_SPLIT_NO_FILE_SELECTED');
  if (!hasPdfSignature(input.file.bytes)) {
    return err('PDF_SPLIT_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('PDF_SPLIT_FILE_TOO_LARGE', {
      details: { name: input.file.name, max: MAX_FILE_MB },
    });
  }
  if (!isValidPageNumber(input.startPage)) return err('PDF_SPLIT_START_PAGE_INVALID');
  if (!isValidPageNumber(input.endPage)) return err('PDF_SPLIT_END_PAGE_INVALID');
  if (input.endPage < input.startPage) return err('PDF_SPLIT_RANGE_INVALID');
  return ok(null);
}
