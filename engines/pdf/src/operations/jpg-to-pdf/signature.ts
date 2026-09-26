/** JPEG's magic bytes: the SOI marker (0xFFD8) immediately followed by the next marker's 0xFF. */
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

/**
 * Whether `bytes` looks like a JPEG file, checked before any attempt to decode it. Unlike PDF,
 * the JPEG signature is always at byte 0 — the spec allows no leading bytes before the SOI marker.
 */
export function hasJpegSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= JPEG_SIGNATURE.length &&
    JPEG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  );
}
