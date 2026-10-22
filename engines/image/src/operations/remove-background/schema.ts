import { z } from 'zod';
import type { ImageFile, ImageOutputFormat, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, imageOutputFormat, resolvedImageFormat } from '../../lib/formats.ts';

export type { ImageFile, ImageOutputFormat, ResolvedImageFormat };
export { imageOutputFormat, resolvedImageFormat };

export const imageRemoveBackgroundInput = z.strictObject({
  /** Optional so 'no file selected' is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  outputFormat: imageOutputFormat.default('png'),
  /** 0-100; only meaningful for jpg/webp output. Ignored for png. */
  quality: z.number().min(0).max(100).optional(),
  /** Tolerance threshold percentage (1-100). */
  tolerance: z.number().min(1).max(100).default(20),
  /** Edge feathering / smoothing radius (0-10). */
  feather: z.number().min(0).max(10).default(2),
  /** Target background color: 'auto' or hex color e.g. '#ffffff'. */
  targetColor: z.string().optional(),
  /** Replacement background: 'transparent', '#ffffff', '#000000', or any hex color. */
  replacementBackground: z.string().default('transparent'),
  /** User-entered output name, normalized by deriveOutputFileName. */
  outputFileName: z.string().optional(),
});

export const imageRemoveBackgroundParams = z.strictObject({});

export const imageRemoveBackgroundOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  tolerance: z.number().int().nonnegative(),
  feather: z.number().int().nonnegative(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  sizeDifferenceBytes: z.number().int(),
  sizeChangePercent: z.number(),
  originalFormat: resolvedImageFormat,
  outputFormat: resolvedImageFormat,
});

export type ImageRemoveBackgroundInput = z.infer<typeof imageRemoveBackgroundInput>;
export type ImageRemoveBackgroundParams = z.infer<typeof imageRemoveBackgroundParams>;
export type ImageRemoveBackgroundOutput = z.infer<typeof imageRemoveBackgroundOutput>;
