import { z } from 'zod';
import type { ImageFile, ImageOutputFormat, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, imageOutputFormat, resolvedImageFormat } from '../../lib/formats.ts';
import { MAX_FILE_BYTES } from '../../lib/limits.ts';

export type { ImageFile, ImageOutputFormat, ResolvedImageFormat };
export { imageOutputFormat, resolvedImageFormat };

export const imageCompressInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  outputFormat: imageOutputFormat.default('same'),
  /** Requested quality ceiling (50-100). Default is 80 if omitted. */
  quality: z.number().min(50).max(100).optional(),
  /** User-entered output name, normalized by deriveOutputFileName. */
  outputFileName: z.string().optional(),
  /** Target max file size in KB if requested. */
  maxFileSizeKB: z
    .number()
    .positive()
    .max(MAX_FILE_BYTES / 1000)
    .optional(),
  /** Whether dimensions can be reduced if quality reduction alone cannot achieve smaller bytes. Default false. */
  allowDimensionReduction: z.boolean().default(false),
});

export const imageCompressParams = z.strictObject({
  outputFileNameSuffix: z.string().optional(),
  outputFileNameFallback: z.string().optional(),
  minQuality: z.number().min(10).max(90).optional(),
});

export const imageCompressOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  /** originalFileSize - outputFileSize: strictly positive for a successful compression. */
  sizeDifferenceBytes: z.number().int().positive(),
  /** Percentage reduction: non-negative number, rounded to 1 decimal. */
  sizeChangePercent: z.number().nonnegative(),
  originalFormat: resolvedImageFormat,
  outputFormat: resolvedImageFormat,
  outputQuality: z.number().min(0).max(100),
  dimensions: z.string(),
  status: z.string(),
  encodeAttempts: z.number().int().positive(),
});

export type ImageCompressInput = z.infer<typeof imageCompressInput>;
export type ImageCompressParams = z.infer<typeof imageCompressParams>;
export type ImageCompressOutput = z.infer<typeof imageCompressOutput>;
