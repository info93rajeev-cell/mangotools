import { err, ok, type Result } from '@mangotools/core';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../../lib/limits.ts';
import { detectImageType } from '../../lib/signature.ts';
import { MAX_WATERMARK_TEXT_LENGTH } from './limits.ts';
import type { ImageWatermarkInput } from './schema.ts';

/**
 * Checks everything that does not require decoding the image: file presence, declared type (by
 * signature, not by extension or MIME claim), file size, and the watermark text itself. Deliberately
 * checked before decoding, the same fail-fast-before-the-expensive-step discipline as
 * `image.resize@1`/`pdf.merge@1`. Position, opacity, font size, and color are all UI-constrained (a
 * select, a bounded number input, and a color picker respectively, matching `outputFormat`'s and
 * `quality`'s own precedent) and are validated by the schema's own enum/range checks instead of a
 * bespoke message here.
 */
export function validateRequest(input: ImageWatermarkInput): Result<null> {
  if (!input.file) return err('IMAGE_NO_FILE_SELECTED');
  if (!detectImageType(input.file.bytes)) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('IMAGE_FILE_TOO_LARGE', { details: { name: input.file.name, max: MAX_FILE_MB } });
  }
  const text = (input.text ?? '').trim();
  if (text === '') return err('IMAGE_WATERMARK_TEXT_REQUIRED');
  if (text.length > MAX_WATERMARK_TEXT_LENGTH) {
    return err('IMAGE_WATERMARK_TEXT_TOO_LONG', { details: { max: MAX_WATERMARK_TEXT_LENGTH } });
  }
  return ok(null);
}
