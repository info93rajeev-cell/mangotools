/** The PDF file signature, "%PDF-", as bytes. The spec allows leading bytes before it. */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

/** How far into the file to look for the signature, matching common PDF-sniffing practice. */
const SIGNATURE_SCAN_WINDOW = 1024;

/** Whether `bytes` looks like a PDF file, checked before any attempt to parse it. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const lastStart = Math.min(bytes.length - PDF_SIGNATURE.length, SIGNATURE_SCAN_WINDOW);
  for (let start = 0; start <= lastStart; start++) {
    if (PDF_SIGNATURE.every((byte, offset) => bytes[start + offset] === byte)) return true;
  }
  return false;
}
