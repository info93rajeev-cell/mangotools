import { z } from 'zod';
import type { ImageFile, ImageOutputFormat, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, imageOutputFormat, resolvedImageFormat } from '../../lib/formats.ts';

export type { ImageFile, ImageOutputFormat, ResolvedImageFormat };
export { imageOutputFormat, resolvedImageFormat };

export const imageResizeInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  targetWidth: z.number(),
  targetHeight: z.number(),
  keepAspectRatio: z.boolean(),
  outputFormat: imageOutputFormat,
  /** 0-100; only meaningful for `jpg`/`webp` output. Ignored for `png`, which has no quality knob. */
  quality: z.number().min(0).max(100).optional(),
  /** User-entered output name, normalized by `deriveOutputFileName`. Optional; see file-name.ts. */
  outputFileName: z.string().optional(),
});

export const imageResizeParams = z.strictObject({
  /** Lets a preset that reuses this operation (Image Compress) pick its own output-name wording,
   * without changing Image Resize's own "-resized" default. See file-name.ts's `OutputFileNameStyle`. */
  outputFileNameSuffix: z.string().optional(),
  outputFileNameFallback: z.string().optional(),
});

export const imageResizeOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  /** originalFileSize - outputFileSize: positive means the output is smaller (a reduction). */
  sizeDifferenceBytes: z.number().int(),
  sizeChangePercent: z.number(),
  /** The source's own detected format (by signature) — added for Image Format Converter (TASK-007B), so a
   * preset can show "converted from X to Y" without a separate lookup. Useful for any preset, not
   * converter-specific. */
  originalFormat: resolvedImageFormat,
  outputFormat: resolvedImageFormat,
});

export type ImageResizeInput = z.infer<typeof imageResizeInput>;
export type ImageResizeParams = z.infer<typeof imageResizeParams>;
export type ImageResizeOutput = z.infer<typeof imageResizeOutput>;
