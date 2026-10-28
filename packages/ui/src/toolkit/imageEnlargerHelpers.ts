import type { OpWarning } from '@mangotools/core';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  DEFAULT_ENHANCEMENT,
  type EnhancementSettings,
  generatePreviewCanvas,
} from './imageEnhancementPipeline.ts';
import type { CropFile } from './imageFileInspection.ts';
import { MIME_MAP } from './imageFileInspection.ts';
import { wrapImageBytesInPdf } from './imagePdfExport.ts';

export type EnlargeOutputFormat = 'png' | 'jpg' | 'webp' | 'pdf';

export interface ImageEnlargerResultData {
  fileName: string;
  bytes: Uint8Array;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalFileSize: number;
  outputFileSize: number;
  scale: number;
  outputFormat: string;
  sharpness: number;
  contrast: number;
  warnings: OpWarning[];
}

export function useEnlargeHistory() {
  const [history, setHistory] = useState<EnhancementSettings[]>([{ ...DEFAULT_ENHANCEMENT }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (next: EnhancementSettings) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), next].slice(-20));
      setHistoryIndex((prev) => Math.min(prev + 1, 19));
    },
    [historyIndex],
  );

  return { history, historyIndex, setHistoryIndex, pushHistory };
}

export function useEnlargeKeyboardShortcuts(undo: () => void, redo: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);
}

export function useEnlargeInitialSample(file: CropFile | null, loadSample: () => Promise<void>) {
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current && !file) {
      initialMountRef.current = false;
      void loadSample();
    }
  }, [file, loadSample]);
}

export function useEnlargePreview(
  decoded: ImageBitmap | null,
  imageSrc: string | null,
  settings: EnhancementSettings,
) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!decoded) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      if (!decoded) return;
      try {
        const pCanvas = generatePreviewCanvas(decoded, settings);
        pCanvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setPreviewUrl((old) => {
                if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
                return url;
              });
            }
          },
          'image/jpeg',
          0.92,
        );
      } catch {
        // ignore preview render error
      }
    }, 45);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [decoded, imageSrc, settings]);

  return previewUrl;
}

export async function renderAndExportBytes(
  canvas: HTMLCanvasElement,
  format: EnlargeOutputFormat,
  baseName: string,
): Promise<{ finalBytes: Uint8Array; finalName: string }> {
  const mime = format === 'pdf' ? 'image/png' : (MIME_MAP[format] ?? 'image/png');
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, 0.92),
  );
  if (!blob) throw new Error('Canvas export failed');

  let finalBytes = new Uint8Array(await blob.arrayBuffer()) as Uint8Array;
  const finalName = `${baseName}.${format}`;

  if (format === 'pdf') {
    const wrapped = await wrapImageBytesInPdf(finalBytes, 'IMAGE_RESIZE_FAILED');
    if (wrapped.ok) finalBytes = wrapped.value.pdfBytes;
  }
  return { finalBytes, finalName };
}
