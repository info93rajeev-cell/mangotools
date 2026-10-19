import { err, ok, type Result } from '@mangotools/core';
import { readFileBytes } from './actions.ts';

/**
 * Browser-side byte validation and inspection for Image Crop before decoding.
 * Detects format and inspects structural chunks to reject APNG and animated WebP.
 */

export interface CropFile {
  name: string;
  size: number;
  bytes: Uint8Array;
}

export interface LoadedImageInfo {
  file: CropFile;
  format: 'jpg' | 'png' | 'webp';
  dims: { width: number; height: number };
  blobUrl: string;
}

export const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function formatFromBytes(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'png';
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.subarray(0, 4));
    const webp = String.fromCharCode(...bytes.subarray(8, 12));
    if (riff === 'RIFF' && webp === 'WEBP') return 'webp';
  }
  return null;
}

function hasApngChunk(bytes: Uint8Array): boolean {
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const len = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === 'acTL') return true;
    if (type === 'IDAT' || type === 'IEND') return false;
    const next = offset + 12 + len;
    if (next <= offset || next > bytes.length) return false;
    offset = next;
  }
  return false;
}

function isWebpAnim(type: string, bytes: Uint8Array, offset: number, len: number): boolean {
  if (type === 'ANIM' || type === 'ANMF') return true;
  if (type === 'VP8X' && len >= 10 && offset + 8 < bytes.length) {
    return (bytes[offset + 8] & 0x02) !== 0;
  }
  return false;
}

function hasWebpAnimChunk(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const riff = String.fromCharCode(...bytes.subarray(0, 4));
  const webp = String.fromCharCode(...bytes.subarray(8, 12));
  if (riff !== 'RIFF' || webp !== 'WEBP') return false;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const len = view.getUint32(offset + 4, true);
    if (isWebpAnim(type, bytes, offset, len)) return true;
    const next = offset + 8 + len + (len & 1);
    if (next <= offset || next > bytes.length) break;
    offset = next;
  }
  return false;
}

export function checkAnimation(bytes: Uint8Array): boolean {
  return hasApngChunk(bytes) || hasWebpAnimChunk(bytes);
}

export function bytesToBlobUrl(bytes: Uint8Array, mime: string): string {
  const safeBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return URL.createObjectURL(new Blob([safeBuffer], { type: mime }));
}

export async function inspectAndDecodeImage(selected: File): Promise<Result<LoadedImageInfo>> {
  const bytes = await readFileBytes(selected);
  const fmt = formatFromBytes(bytes);
  if (!fmt) {
    return err('IMAGE_INVALID_FILE_TYPE', { details: { name: selected.name } });
  }
  if (checkAnimation(bytes)) {
    return err('IMAGE_ANIMATED_UNSUPPORTED', { details: { name: selected.name } });
  }

  const blobUrl = bytesToBlobUrl(bytes, MIME_MAP[fmt]);
  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = blobUrl;
    });
    return ok({
      file: { name: selected.name, size: selected.size, bytes },
      format: fmt,
      dims: { width: img.naturalWidth, height: img.naturalHeight },
      blobUrl,
    });
  } catch {
    URL.revokeObjectURL(blobUrl);
    return err('IMAGE_UNREADABLE', { details: { name: selected.name } });
  }
}
