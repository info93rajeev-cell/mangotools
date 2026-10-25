import { downloadBytes } from './actions.ts';
import { MIME_MAP } from './imageFileInspection.ts';

export const FORMAT_MIME_MAP: Record<string, string> = {
  ...MIME_MAP,
  pdf: 'application/pdf',
};

export interface CutoutDownloadTarget {
  fileName: string;
  bytes: Uint8Array;
  outputWidth: number;
  outputHeight: number;
  outputFormat: string;
}

export async function downloadCutout(
  res: CutoutDownloadTarget,
  resultUrl: string | null,
  size: 'original' | 'fast' = 'original',
): Promise<void> {
  const mime = FORMAT_MIME_MAP[res.outputFormat] ?? 'image/png';
  if (size === 'original' || typeof window === 'undefined' || typeof document === 'undefined') {
    downloadBytes(res.bytes, res.fileName, mime);
    return;
  }

  try {
    const img = new Image();
    img.src = resultUrl ?? URL.createObjectURL(new Blob([res.bytes as BlobPart], { type: mime }));
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    });

    const maxDim = 500;
    const w = img.naturalWidth || res.outputWidth;
    const h = img.naturalHeight || res.outputHeight;
    if (w <= maxDim && h <= maxDim) {
      downloadBytes(res.bytes, res.fileName, mime);
      return;
    }

    const scale = Math.min(maxDim / w, maxDim / h);
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      downloadBytes(res.bytes, res.fileName, mime);
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime));
    if (!blob) {
      downloadBytes(res.bytes, res.fileName, mime);
      return;
    }

    const dotIdx = res.fileName.lastIndexOf('.');
    const base = dotIdx !== -1 ? res.fileName.slice(0, dotIdx) : res.fileName;
    const ext = dotIdx !== -1 ? res.fileName.slice(dotIdx) : `.${res.outputFormat}`;
    const fastFileName = `${base}-web-500${ext}`;

    const arrayBuf = await blob.arrayBuffer();
    downloadBytes(new Uint8Array(arrayBuf), fastFileName, mime);
  } catch {
    downloadBytes(res.bytes, res.fileName, mime);
  }
}
