import { err, ok, type Result } from '@mangotools/core';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '../../lib/limits.ts';
import { detectImageType } from '../../lib/signature.ts';
import type { ImageFaviconInput } from './schema.ts';

/**
 * Checks everything that does not require decoding the image: file presence, declared type (by
 * signature, not by extension or MIME claim), and file size. `size` is not hand-checked here — it is
 * fully constrained by the UI's `<select>` (see `presets/image/favicon.yaml`), so an invalid value is
 * rejected by the schema's own `z.enum` as a generic `INVALID_INPUT`, matching `image.crop@1`'s own
 * `outputFormat` precedent for a select-constrained (not hand-typed) field.
 */
export function validateRequest(input: ImageFaviconInput): Result<null> {
  if (!input.file) return err('IMAGE_NO_FILE_SELECTED');
  if (!detectImageType(input.file.bytes)) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: input.file.name } });
  }
  if (input.file.bytes.byteLength > MAX_FILE_BYTES) {
    return err('IMAGE_FILE_TOO_LARGE', { details: { name: input.file.name, max: MAX_FILE_MB } });
  }
  return ok(null);
}
