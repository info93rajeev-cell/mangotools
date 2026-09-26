import { z } from 'zod';

const pdfFile = z.strictObject({
  /** The original file name, used only to identify a file in error details. */
  name: z.string().min(1),
  bytes: z.instanceof(Uint8Array),
});

export const pdfMergeInput = z.strictObject({
  files: z.array(pdfFile),
  /** User-entered output file name, sanitized by the operation. Optional; see file-name.ts. */
  outputFileName: z.string().optional(),
});

export const pdfMergeParams = z.strictObject({});

export const pdfMergeOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  fileCount: z.number().int().nonnegative(),
  totalPageCount: z.number().int().nonnegative(),
});

export type PdfFile = z.infer<typeof pdfFile>;
export type PdfMergeInput = z.infer<typeof pdfMergeInput>;
export type PdfMergeParams = z.infer<typeof pdfMergeParams>;
export type PdfMergeOutput = z.infer<typeof pdfMergeOutput>;
