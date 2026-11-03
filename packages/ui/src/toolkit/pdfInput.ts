/**
 * Opening a PDF the user chose, with the limits the PDF tools state on their pages
 * (engines/pdf merge and split limits.ts, founder-approved) and a clear refusal for
 * password-protected files, which would otherwise come out as blank or garbled pages.
 */
import { PDFDocument } from 'pdf-lib';

export const MAX_FILE_MB = 25;
export const MAX_TOTAL_MB = 75;
export const MAX_FILE_COUNT = 20;
const MB = 1024 * 1024;

export type OpenResult = { ok: true; doc: PDFDocument } | { ok: false; message: string };

export async function openUserPdf(
  name: string,
  bytes: Uint8Array,
  maxMb = MAX_FILE_MB,
): Promise<OpenResult> {
  if (bytes.length > maxMb * MB) {
    return { ok: false, message: `${name} is larger than ${maxMb} MB, the limit for this tool.` };
  }
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    return { ok: false, message: `${name} could not be read as a PDF. It may be damaged.` };
  }
  if (doc.isEncrypted) {
    return {
      ok: false,
      message: `${name} is password-protected. Remove the password in your PDF reader, then try again.`,
    };
  }
  return { ok: true, doc };
}

/** The merge limits: how many of the incoming files fit, and why the rest do not. */
export function mergeCapacity(
  existing: { count: number; bytes: number },
  incoming: { name: string; size: number }[],
): { accepted: number; message: string | null } {
  let count = existing.count;
  let bytes = existing.bytes;
  for (const [i, f] of incoming.entries()) {
    if (count + 1 > MAX_FILE_COUNT) {
      return { accepted: i, message: `Up to ${MAX_FILE_COUNT} files can be merged at once.` };
    }
    if (bytes + f.size > MAX_TOTAL_MB * MB) {
      return { accepted: i, message: `The files together can be up to ${MAX_TOTAL_MB} MB.` };
    }
    count++;
    bytes += f.size;
  }
  return { accepted: incoming.length, message: null };
}
