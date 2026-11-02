import { PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import {
  type CompressionPreset,
  compressToTarget,
  reductionPercent,
  settingsFor,
  type TargetResult,
} from './pdfCompressor.ts';
import { createCompressSamplePdf, SAMPLE_COMPRESS_NAME } from './samplePdfDocuments.ts';

export type { CompressionPreset } from './pdfCompressor.ts';

const MB = 1024 * 1024;

function useCompressOptions() {
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [imageQuality, setImageQuality] = useState(70);
  const [convertToGrayscale, setConvertToGrayscale] = useState(false);
  const [removeThumbnails, setRemoveThumbnails] = useState(true);
  const [useSizeTarget, setUseSizeTarget] = useState(false);
  const [maxOutputSizeMb, setMaxOutputSizeMb] = useState(10);
  return {
    preset,
    setPreset,
    imageQuality,
    setImageQuality,
    convertToGrayscale,
    setConvertToGrayscale,
    removeThumbnails,
    setRemoveThumbnails,
    useSizeTarget,
    setUseSizeTarget,
    maxOutputSizeMb,
    setMaxOutputSizeMb,
  };
}

function useCompressFileState(notify?: (msg: string) => void) {
  const [fileName, setFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);

  const take = async (name: string, bytes: Uint8Array) => {
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      setFileName(name);
      setFileSizeBytes(bytes.length);
      setTotalPages(doc.getPageCount());
      setFileBytes(bytes);
      return true;
    } catch {
      notify?.('This file could not be read as a PDF.');
      return false;
    }
  };

  return {
    fileName,
    fileSizeBytes,
    totalPages,
    fileBytes,
    clearAll: () => {
      setFileName('');
      setTotalPages(0);
      setFileSizeBytes(0);
      setFileBytes(null);
    },
    loadSampleCompress: async () => {
      if (await take(SAMPLE_COMPRESS_NAME, await createCompressSamplePdf())) {
        notify?.('Sample PDF with photos loaded');
      }
    },
    handleAddNativeFile: async (file: File | undefined) => {
      if (!file) return;
      if (await take(file.name, new Uint8Array(await file.arrayBuffer()))) {
        notify?.(`Loaded ${file.name}`);
      }
    },
  };
}

function downloadBytes(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function outcomeMessage(r: TargetResult): string {
  if (r.noGain) return 'This PDF is already compact; the original is kept.';
  const pct = reductionPercent(r.originalBytes, r.compressedBytes);
  const target = r.targetMet ? '' : ' The size target could not be reached.';
  return `PDF compressed: ${pct}% smaller.${target}`;
}

export function usePdfCompressStudio(notify?: (msg: string) => void) {
  const fileState = useCompressFileState(notify);
  const opts = useCompressOptions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TargetResult | null>(null);

  // A result belongs to one file and one set of settings.
  useEffect(
    () => setResult(null),
    [
      fileState.fileBytes,
      opts.preset,
      opts.imageQuality,
      opts.convertToGrayscale,
      opts.removeThumbnails,
      opts.useSizeTarget,
      opts.maxOutputSizeMb,
    ],
  );

  async function executeCompress(): Promise<TargetResult | null> {
    if (!fileState.fileBytes) return null;
    setIsProcessing(true);
    try {
      const settings = settingsFor(
        opts.preset,
        opts.imageQuality,
        opts.convertToGrayscale,
        opts.removeThumbnails,
      );
      const target = opts.useSizeTarget ? Math.max(0.1, opts.maxOutputSizeMb) * MB : null;
      const r = await compressToTarget(fileState.fileBytes, settings, target);
      setResult(r);
      notify?.(outcomeMessage(r));
      return r;
    } catch {
      notify?.('Compression failed. The PDF may be damaged or protected.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  const outName = `${fileState.fileName.replace(/\.[^/.]+$/, '') || 'document'}-compressed.pdf`;

  return {
    ...fileState,
    ...opts,
    isProcessing,
    result,
    executeCompress,
    downloadCompressed: async () => {
      const r = result ?? (await executeCompress());
      if (r) downloadBytes(r.bytes, outName);
    },
    copySummary: () => {
      if (!result) {
        notify?.('Compress the PDF first.');
        return;
      }
      const pct = reductionPercent(result.originalBytes, result.compressedBytes);
      const text = `${fileState.fileName}: ${(result.originalBytes / MB).toFixed(2)} MB → ${(
        result.compressedBytes / MB
      ).toFixed(2)} MB (${pct}% smaller), ${result.imagesRecompressed} of ${
        result.imagesFound
      } images re-encoded.`;
      void navigator.clipboard?.writeText(text);
      notify?.('Summary copied');
    },
  };
}
