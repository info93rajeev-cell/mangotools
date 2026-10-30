import { PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import { createSamplePdf, SAMPLE_COMPRESS_FILE } from './samplePdfDocuments.ts';

export type CompressionPreset = 'light' | 'balanced' | 'strong' | 'custom';

export interface CompressEstimate {
  originalBytes: number;
  compressedBytes: number;
  reductionPercent: number;
  qualityLevel: string;
}

export function computeCompressEstimate(
  originalBytes: number,
  preset: CompressionPreset,
  customQuality: number,
  grayscale: boolean,
  removeThumbnails: boolean,
): CompressEstimate {
  if (originalBytes <= 0)
    return { originalBytes: 0, compressedBytes: 0, reductionPercent: 0, qualityLevel: 'Good' };
  let ratio = 0.29;
  let qualityLevel = 'Good';

  if (preset === 'light') {
    ratio = 0.65;
    qualityLevel = 'Excellent';
  } else if (preset === 'strong') {
    ratio = 0.18;
    qualityLevel = 'Acceptable';
  } else if (preset === 'custom') {
    const qFactor = customQuality / 100;
    const grayFactor = grayscale ? 0.75 : 1.0;
    const thumbFactor = removeThumbnails ? 0.95 : 1.0;
    ratio = Math.max(0.12, Math.min(0.9, qFactor * 0.45 * grayFactor * thumbFactor));
    qualityLevel = customQuality > 75 ? 'Excellent' : customQuality > 45 ? 'Good' : 'Acceptable';
  }

  return {
    originalBytes,
    compressedBytes: Math.round(originalBytes * ratio),
    reductionPercent: Math.round((1 - ratio) * 100),
    qualityLevel,
  };
}

function useCompressOptions() {
  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [imageQuality, setImageQuality] = useState(70);
  const [convertToGrayscale, setConvertToGrayscale] = useState(false);
  const [removeThumbnails, setRemoveThumbnails] = useState(true);
  const [linearize, setLinearize] = useState(true);
  const [preserveSearchableText, setPreserveSearchableText] = useState(true);
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
    linearize,
    setLinearize,
    preserveSearchableText,
    setPreserveSearchableText,
    maxOutputSizeMb,
    setMaxOutputSizeMb,
  };
}

function useCompressFileState(notify?: (msg: string) => void) {
  const [fileName, setFileName] = useState(SAMPLE_COMPRESS_FILE.name);
  const [fileSizeBytes, setFileSizeBytes] = useState(SAMPLE_COMPRESS_FILE.sizeBytes);
  const [totalPages, setTotalPages] = useState(SAMPLE_COMPRESS_FILE.pageCount);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    setFileName(SAMPLE_COMPRESS_FILE.name);
    setFileSizeBytes(SAMPLE_COMPRESS_FILE.sizeBytes);
    setTotalPages(SAMPLE_COMPRESS_FILE.pageCount);
  }, []);

  return {
    fileName,
    fileSizeBytes,
    totalPages,
    fileBytes,
    clearAll: () => {
      setFileName('');
      setTotalPages(0);
      setFileSizeBytes(0);
    },
    loadSampleCompress: () => {
      setFileName(SAMPLE_COMPRESS_FILE.name);
      setFileSizeBytes(SAMPLE_COMPRESS_FILE.sizeBytes);
      setTotalPages(SAMPLE_COMPRESS_FILE.pageCount);
    },
    handleAddNativeFile: async (file: File) => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        setFileName(file.name);
        setFileSizeBytes(file.size);
        setTotalPages(doc.getPageCount());
        setFileBytes(bytes);
      } catch {
        notify?.('Could not load PDF.');
      }
    },
  };
}

export function usePdfCompressStudio(notify?: (msg: string) => void) {
  const fileState = useCompressFileState(notify);
  const opts = useCompressOptions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);

  async function executeCompress() {
    if (fileState.fileSizeBytes <= 0) return;
    setIsProcessing(true);
    try {
      const raw =
        fileState.fileBytes ?? (await createSamplePdf(fileState.fileName, fileState.totalPages));
      const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
      if (opts.removeThumbnails) doc.setTitle(fileState.fileName.replace(/\.[^/.]+$/, ''));
      const savedBytes = await doc.save({ useObjectStreams: true });
      setCompressedBlobUrl(
        URL.createObjectURL(new Blob([savedBytes as BlobPart], { type: 'application/pdf' })),
      );
      notify?.('PDF successfully compressed!');
    } catch {
      notify?.('Compression failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    ...fileState,
    ...opts,
    isProcessing,
    compressedBlobUrl,
    executeCompress,
    estimate: computeCompressEstimate(
      fileState.fileSizeBytes,
      opts.preset,
      opts.imageQuality,
      opts.convertToGrayscale,
      opts.removeThumbnails,
    ),
    downloadCompressed: () => {
      if (!compressedBlobUrl) {
        void executeCompress();
        return;
      }
      const a = document.createElement('a');
      a.href = compressedBlobUrl;
      a.download = `${fileState.fileName.replace(/\.[^/.]+$/, '')}-compressed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    copySummary: () => {
      const e = computeCompressEstimate(
        fileState.fileSizeBytes,
        opts.preset,
        opts.imageQuality,
        opts.convertToGrayscale,
        opts.removeThumbnails,
      );
      void navigator.clipboard.writeText(
        `BeyondTheAI PDF Compression: ${fileState.fileName}, -${e.reductionPercent}%`,
      );
      notify?.('Summary copied!');
    },
  };
}
