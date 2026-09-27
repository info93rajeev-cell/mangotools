import { z } from 'zod';
import type { ImageFile, ImageOutputFormat, ResolvedImageFormat } from '../../lib/formats.ts';
import { imageFile, imageOutputFormat, resolvedImageFormat } from '../../lib/formats.ts';

export type { ImageFile, ImageOutputFormat, ResolvedImageFormat };
export { imageOutputFormat, resolvedImageFormat };

export const watermarkPosition = z.enum([
  'top-left',
  'top-right',
  'center',
  'bottom-left',
  'bottom-right',
]);
export type WatermarkPosition = z.infer<typeof watermarkPosition>;

export const imageWatermarkInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: imageFile.optional(),
  /** Optional at the schema level (a `useFileTool` archetype-D field sends nothing at all when it is
   * empty — see `packages/ui/src/archetypes/useFileTool.ts`'s `extraInputValues` — unlike `targetWidth`/
   * `targetHeight` on other operations, which are always prefilled before a real submit can happen). A
   * required-but-missing schema field would otherwise surface the generic `INVALID_INPUT` message instead
   * of this operation's own specific one; `validate.ts` handles both "missing" and "present but empty or
   * whitespace" the same way, so either produces `IMAGE_WATERMARK_TEXT_REQUIRED`. */
  text: z.string().optional(),
  position: watermarkPosition,
  /** 10-100; a value outside this range is a schema-level rejection, matching `quality`'s own pattern. */
  opacity: z.number().min(10).max(100),
  /** Pixels; a sane, UI-constrained range (an `<input type="number">`, never hand-typed out of bounds). */
  fontSize: z.number().min(8).max(200),
  /** A `#rrggbb` hex color, matching what an `<input type="color">` always emits. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  outputFormat: imageOutputFormat,
  /** 0-100; only meaningful for `jpg`/`webp` output. Ignored for `png`, which has no quality knob. */
  quality: z.number().min(0).max(100).optional(),
  /** User-entered output name, normalized by `deriveOutputFileName`. Optional; see lib/file-name.ts. */
  outputFileName: z.string().optional(),
});

export const imageWatermarkParams = z.strictObject({});

export const imageWatermarkOutput = z.strictObject({
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
  originalFormat: resolvedImageFormat,
  outputFormat: resolvedImageFormat,
  /** Echoes the resolved watermark settings, so the result view can show exactly what was applied
   * without the caller needing to remember its own request. */
  watermarkText: z.string(),
  position: watermarkPosition,
  opacity: z.number(),
  fontSize: z.number(),
  color: z.string(),
});

export type ImageWatermarkInput = z.infer<typeof imageWatermarkInput>;
export type ImageWatermarkParams = z.infer<typeof imageWatermarkParams>;
export type ImageWatermarkOutput = z.infer<typeof imageWatermarkOutput>;
