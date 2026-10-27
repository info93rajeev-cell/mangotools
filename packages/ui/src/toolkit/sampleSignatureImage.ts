import type { CropFile } from './imageFileInspection.ts';

export const SAMPLE_SIGNATURE_NAME = 'sample-signature.png';
export const SAMPLE_SIGNATURE_WIDTH = 480;
export const SAMPLE_SIGNATURE_HEIGHT = 180;

// Minimal valid 1x1 fallback PNG if network is unreachable
const FALLBACK_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

export async function createSignatureSample(): Promise<{ file: CropFile; blobUrl: string }> {
  if (typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/samples/sample-signature.png');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        return {
          file: {
            name: SAMPLE_SIGNATURE_NAME,
            size: bytes.byteLength,
            bytes,
          },
          blobUrl,
        };
      }
    } catch {
      // offline fallback
    }
  }
  const blobUrl = typeof URL !== 'undefined' ? URL.createObjectURL(new Blob([FALLBACK_PNG])) : '';
  return {
    file: {
      name: SAMPLE_SIGNATURE_NAME,
      size: FALLBACK_PNG.byteLength,
      bytes: FALLBACK_PNG,
    },
    blobUrl,
  };
}
