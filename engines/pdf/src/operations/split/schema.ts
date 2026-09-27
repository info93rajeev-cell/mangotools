import { z } from 'zod';

const pdfFile = z.strictObject({
  /** The original file name, echoed in the output and used to identify the file in error details. */
  name: z.string().min(1),
  bytes: z.instanceof(Uint8Array),
});

export const pdfSplitInput = z.strictObject({
  /** Optional so "no file selected" is a normal validation error, not a schema rejection. */
  file: pdfFile.optional(),
  /** 1-based page numbers, matching how a person counts pages in a document — converted to pdf-lib's
   * own 0-based page indices only inside `operation.ts`. Checked (positive integer, end >= start) in
   * `validate.ts`, matching `image.crop@1`'s own hand-typed-numeric-field precedent. */
  startPage: z.number(),
  endPage: z.number(),
  /** User-entered output name, normalized by `sanitizeOutputFileName`. Optional; see lib/file-name.ts. */
  outputFileName: z.string().optional(),
});

export const pdfSplitParams = z.strictObject({});

export const pdfSplitOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  originalFileName: z.string(),
  originalPageCount: z.number().int().nonnegative(),
  /** Echo the resolved 1-based range, so a result view can show exactly what was extracted. */
  startPage: z.number().int().positive(),
  endPage: z.number().int().positive(),
  extractedPageCount: z.number().int().positive(),
  outputFileSize: z.number().int().nonnegative(),
});

export type PdfFile = z.infer<typeof pdfFile>;
export type PdfSplitInput = z.infer<typeof pdfSplitInput>;
export type PdfSplitParams = z.infer<typeof pdfSplitParams>;
export type PdfSplitOutput = z.infer<typeof pdfSplitOutput>;
