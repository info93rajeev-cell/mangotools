import { z } from 'zod';

const imageFile = z.strictObject({
  /** The original file name, used to derive the output name and to identify it in error details. */
  name: z.string().min(1),
  bytes: z.instanceof(Uint8Array),
});

export const imageOutputFormat = z.enum(['same', 'jpg', 'png', 'webp']);
export const resolvedImageFormat = z.enum(['jpg', 'png', 'webp']);

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

export const imageResizeParams = z.strictObject({});

export const imageResizeOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  outputFormat: resolvedImageFormat,
});

export type ImageFile = z.infer<typeof imageFile>;
export type ImageOutputFormat = z.infer<typeof imageOutputFormat>;
export type ResolvedImageFormat = z.infer<typeof resolvedImageFormat>;
export type ImageResizeInput = z.infer<typeof imageResizeInput>;
export type ImageResizeParams = z.infer<typeof imageResizeParams>;
export type ImageResizeOutput = z.infer<typeof imageResizeOutput>;
