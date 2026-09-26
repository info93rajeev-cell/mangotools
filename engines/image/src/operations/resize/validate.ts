import { err, ok, type Result } from '@mangotools/core';
import { MAX_FILE_BYTES, MAX_FILE_MB, MAX_SINGLE_AXIS_PIXELS } from './limits.ts';
import type { ImageResizeInput } from './schema.ts';
import { detectImageType } from './signature.ts';

function isValidTargetAxis(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_SINGLE_AXIS_PIXELS;
}

/**
 * Checks everything that does not require decoding the image: file presence, declared type (by
 * signature, not by extension or MIME claim), size, and the requested target dimensions. Deliberately
 * checked before decoding, and before the pixel-cap/output-size checks in `operation.ts` that need the
 * decoded bitmap — the same fail-fast-before-the-expensive-step discipline as `pdf.merge@1`/
 * `pdf.jpg-to-pdf@1`. Pure and Node-testable: nothing here touches a canvas API.
 */
export function validateRequest(input: ImageResizeInput): Result<null> {
  if (!input.file) return err('IMAGE_NO_FILE_SELECTED');
  if (!detectImageType(input.file.bytes)) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('IMAGE_FILE_TOO_LARGE', { details: { name: input.file.name, max: MAX_FILE_MB } });
  }
  if (!isValidTargetAxis(input.targetWidth) || !isValidTargetAxis(input.targetHeight)) {
    return err('IMAGE_DIMENSIONS_INVALID');
  }
  return ok(null);
}
