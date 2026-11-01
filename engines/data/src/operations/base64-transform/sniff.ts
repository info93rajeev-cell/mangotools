/** Recognises a few common file types from their first bytes (magic numbers). */
const SIGNATURES: readonly { mime: string; bytes: readonly number[]; offset?: number }[] = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
];

export function sniffMime(bytes: Uint8Array): string | undefined {
  for (const sig of SIGNATURES) {
    const at = sig.offset ?? 0;
    if (bytes.length < at + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => bytes[at + i] === b)) {
      if (sig.mime === 'image/webp' && !(bytes[0] === 0x52 && bytes[1] === 0x49)) continue;
      return sig.mime;
    }
  }
  return undefined;
}

const DATA_URI = /^\s*data:([a-z]+\/[a-z0-9.+-]+)?(?:;[a-z0-9=-]+)*;base64,/i;

/** Splits a `data:<mime>;base64,` prefix from the payload, when there is one. */
export function splitDataUri(text: string): { payload: string; mime?: string } {
  const match = DATA_URI.exec(text);
  if (!match) return { payload: text };
  return { payload: text.slice(match[0].length), mime: match[1]?.toLowerCase() };
}

/** Latin1 string → bytes; null when a character is above 255. */
export function latin1Bytes(text: string): Uint8Array | null {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 255) return null;
    bytes[i] = code;
  }
  return bytes;
}

/** Bytes → latin1 string, built in chunks so large files do not overflow the call stack. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}
