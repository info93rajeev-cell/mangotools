import { z } from 'zod';

const jpgFile = z.strictObject({
  /** The original file name, used only to identify a file in error details. */
  name: z.string().min(1),
  bytes: z.instanceof(Uint8Array),
});

export const pdfJpgToPdfInput = z.strictObject({
  files: z.array(jpgFile),
  /** User-entered output file name, sanitized by the operation. Optional; see file-name.ts. */
  outputFileName: z.string().optional(),
});

export const pdfJpgToPdfParams = z.strictObject({});

export const pdfJpgToPdfOutput = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  fileName: z.string(),
  imageCount: z.number().int().nonnegative(),
});

export type JpgFile = z.infer<typeof jpgFile>;
export type PdfJpgToPdfInput = z.infer<typeof pdfJpgToPdfInput>;
export type PdfJpgToPdfParams = z.infer<typeof pdfJpgToPdfParams>;
export type PdfJpgToPdfOutput = z.infer<typeof pdfJpgToPdfOutput>;
