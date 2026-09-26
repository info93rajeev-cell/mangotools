export type DetectedImageType = 'jpg' | 'png' | 'webp';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
/** The full 8-byte PNG signature (not just the leading 0x89), so a truncated file is not "recognized". */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return bytes.length >= signature.length && signature.every((byte, i) => bytes[i] === byte);
}

/** WebP is a RIFF container: "RIFF" at byte 0, size at 4-7, "WEBP" at byte 8. */
function isWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP';
}

/**
 * Detects a JPG, PNG, or WebP signature, checked before any attempt to decode. Returns `null` for
 * anything else, including a declared-but-wrong file extension.
 */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'jpg';
  if (startsWith(bytes, PNG_SIGNATURE)) return 'png';
  if (isWebp(bytes)) return 'webp';
  return null;
}

export const MIME_FOR_TYPE: Record<DetectedImageType, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
