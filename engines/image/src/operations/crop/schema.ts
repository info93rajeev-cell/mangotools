import { z } from 'zod';
import type { ImageFile, ImageOutputFormat, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, imageOutputFormat, resolvedImageFormat } from '../../lib/formats.ts';

export type { ImageFile, ImageOutputFormat, ResolvedImageFormat };
export { imageOutputFormat, resolvedImageFormat };

export const imageCropInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  /** Pixels from the left/top edge of the source image. Checked (non-negative integer) in `validate.ts`,
   * not by schema alone, matching `image.resize@1`'s own `targetWidth`/`targetHeight` precedent — a
   * hand-typed numeric field deserves its own plain-English message, not the generic schema one. */
  cropX: z.number(),
  cropY: z.number(),
  /** The crop rectangle's own size in pixels — also the exact output size (this operation never scales). */
  cropWidth: z.number(),
  cropHeight: z.number(),
  outputFormat: imageOutputFormat,
  /** 0-100; only meaningful for `jpg`/`webp` output. Ignored for `png`, which has no quality knob. */
  quality: z.number().min(0).max(100).optional(),
  /** User-entered output name, normalized by `deriveOutputFileName`. Optional; see lib/file-name.ts. */
  outputFileName: z.string().optional(),
});

export const imageCropParams = z.strictObject({});

export const imageCropOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  /** Echoes the resolved crop rectangle, so the result view can show exactly what was applied. */
  cropX: z.number().int().nonnegative(),
  cropY: z.number().int().nonnegative(),
  cropWidth: z.number().int().positive(),
  cropHeight: z.number().int().positive(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  /** originalFileSize - outputFileSize: positive means the output is smaller (a reduction). */
  sizeDifferenceBytes: z.number().int(),
  sizeChangePercent: z.number(),
  originalFormat: resolvedImageFormat,
  outputFormat: resolvedImageFormat,
});

export type ImageCropInput = z.infer<typeof imageCropInput>;
export type ImageCropParams = z.infer<typeof imageCropParams>;
export type ImageCropOutput = z.infer<typeof imageCropOutput>;
