/** Lowercase hex of the first `limit` bytes. */
export function hexPreview(bytes: Uint8Array, limit = 64): string {
  let out = '';
  const n = Math.min(bytes.length, limit);
  for (let i = 0; i < n; i++) out += (bytes[i] ?? 0).toString(16).padStart(2, '0');
  return out;
}

export function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Decodes UTF-8 strictly; returns null when the bytes are not valid UTF-8. */
export function decodeUtf8Strict(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return null;
  }
}
