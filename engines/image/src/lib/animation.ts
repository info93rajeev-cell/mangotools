/**
 * Bounded structural animation detection for PNG (APNG) and WebP.
 * Rejects animated images before decoding to avoid silently flattening animations into static crops.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) return false;
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

function isWebpContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  return ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP';
}

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset] ?? 0,
    bytes[offset + 1] ?? 0,
    bytes[offset + 2] ?? 0,
    bytes[offset + 3] ?? 0,
  );
}

/**
 * Scans PNG chunks for an 'acTL' (Animation Control) chunk.
 * In APNG specification, 'acTL' must appear before 'IDAT'.
 */
function isApng(bytes: Uint8Array): boolean {
  if (!isPng(bytes)) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const chunkLength = view.getUint32(offset);
    const chunkType = fourCC(bytes, offset + 4);

    if (chunkType === 'acTL') return true;
    if (chunkType === 'IDAT' || chunkType === 'IEND') return false;

    // Advance: 4 bytes length + 4 bytes type + data length + 4 bytes CRC
    const nextOffset = offset + 12 + chunkLength;
    if (nextOffset <= offset || nextOffset > bytes.length) return false;
    offset = nextOffset;
  }
  return false;
}

/**
 * Scans WebP RIFF chunks for animation indicators:
 * 1. VP8X extended header with the animation flag set (bit 1 of flags byte at offset 20).
 * 2. ANIM or ANMF chunk headers.
 */
function isAnimatedWebp(bytes: Uint8Array): boolean {
  if (!isWebpContainer(bytes)) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkType = fourCC(bytes, offset);
    const chunkLength = view.getUint32(offset + 4, true);

    if (chunkType === 'VP8X' && chunkLength >= 10 && offset + 8 < bytes.length) {
      const flags = bytes[offset + 8] ?? 0;
      if ((flags & 0x02) !== 0) return true;
    }
    if (chunkType === 'ANIM' || chunkType === 'ANMF') return true;

    // RIFF chunks are padded to even byte offsets
    const paddedLength = chunkLength + (chunkLength & 1);
    const nextOffset = offset + 8 + paddedLength;
    if (nextOffset <= offset || nextOffset > bytes.length) break;
    offset = nextOffset;
  }
  return false;
}

/**
 * Returns true if the image bytes represent an animated image (APNG or animated WebP).
 * Static JPG, PNG, and static WebP return false.
 */
export function isAnimatedImage(bytes: Uint8Array): boolean {
  return isApng(bytes) || isAnimatedWebp(bytes);
}
