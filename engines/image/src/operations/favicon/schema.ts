import { z } from 'zod';
import type { ImageFile, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, resolvedImageFormat } from '../../lib/formats.ts';

export type { ImageFile, ResolvedImageFormat };
export { resolvedImageFormat };

/** Common favicon PNG sizes (px, square). Kept as a string enum, matching `image.crop@1`'s own
 * `outputFormat` precedent: the UI always sends a `kind: enum` field's value as a string (see
 * `useFileTool.ts`'s `fieldInputValue`), so the schema accepts what the select control actually
 * produces rather than requiring a UI-side coercion step. Parsed to a number in `operation.ts`. */
export const faviconSize = z.enum(['16', '32', '48', '180', '192', '512']);
export type FaviconSize = z.infer<typeof faviconSize>;

export const imageFaviconInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  size: faviconSize,
  /** User-entered output name, normalized by `deriveOutputFileName`. Optional; see lib/file-name.ts. */
  outputFileName: z.string().optional(),
});

export const imageFaviconParams = z.strictObject({});

export const imageFaviconOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalWidth: z.number().int().positive(),
  originalHeight: z.number().int().positive(),
  /** Always square — the generated favicon's width and height, both equal to this. */
  outputSize: z.number().int().positive(),
  originalFileSize: z.number().int().nonnegative(),
  outputFileSize: z.number().int().nonnegative(),
  /** originalFileSize - outputFileSize: positive means the output is smaller (a reduction). */
  sizeDifferenceBytes: z.number().int(),
  sizeChangePercent: z.number(),
  originalFormat: resolvedImageFormat,
  /** Always `'png'` in v1 — see README's "Format" section for why `.ico` is deferred. */
  outputFormat: resolvedImageFormat,
});

export type ImageFaviconInput = z.infer<typeof imageFaviconInput>;
export type ImageFaviconParams = z.infer<typeof imageFaviconParams>;
export type ImageFaviconOutput = z.infer<typeof imageFaviconOutput>;
