import { PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import { buildZipArchive, type ZipEntry } from './docxZipPacker.ts';
import {
  createSamplePdf,
  SAMPLE_HEAVY_BOOK_FILE,
  SAMPLE_SPLIT_FILE,
} from './samplePdfDocuments.ts';

export interface SplitRange {
  id: string;
  start: number;
  end: number;
}

export interface SplitPartInfo {
  index: number;
  name: string;
  startPage: number;
  endPage: number;
  pageCount: number;
  sizeBytes: number;
}

export type SplitMode = 'ranges' | 'extract' | 'every' | 'chunks';

function resolveRangeParts(
  ranges: SplitRange[],
  totalPages: number,
  pattern: string,
  baseFileSize: number,
): SplitPartInfo[] {
  const parts: SplitPartInfo[] = [];
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (!r) continue;
    const count = Math.max(0, r.end - r.start + 1);
    const estSize = Math.round((baseFileSize / totalPages) * count);
    const name = `${(pattern || 'Part_{n}').replace('{n}', String(i + 1))}.pdf`;
    parts.push({
      index: i + 1,
      name,
      startPage: r.start,
      endPage: r.end,
      pageCount: count,
      sizeBytes: estSize,
    });
  }
  return parts;
}

function resolveChunkParts(
  chunkSize: number,
  totalPages: number,
  pattern: string,
  baseFileSize: number,
): SplitPartInfo[] {
  const parts: SplitPartInfo[] = [];
  const size = Math.max(1, chunkSize);
  let pIdx = 1;
  for (let s = 1; s <= totalPages; s += size) {
    const e = Math.min(s + size - 1, totalPages);
    const count = e - s + 1;
    const estSize = Math.round((baseFileSize / totalPages) * count);
    const name = `${(pattern || 'Part_{n}').replace('{n}', String(pIdx))}.pdf`;
    parts.push({
      index: pIdx,
      name,
      startPage: s,
      endPage: e,
      pageCount: count,
      sizeBytes: estSize,
    });
    pIdx++;
  }
  return parts;
}

function resolveEveryParts(
  totalPages: number,
  pattern: string,
  baseFileSize: number,
): SplitPartInfo[] {
  const parts: SplitPartInfo[] = [];
  const limit = Math.min(totalPages, 50);
  for (let i = 1; i <= limit; i++) {
    const estSize = Math.round(baseFileSize / totalPages);
    const name = `${(pattern || 'Page_{n}').replace('{n}', String(i))}.pdf`;
    parts.push({ index: i, name, startPage: i, endPage: i, pageCount: 1, sizeBytes: estSize });
  }
  return parts;
}

export function resolveSplitParts(
  mode: SplitMode,
  totalPages: number,
  ranges: SplitRange[],
  _extractInput: string,
  chunkSize: number,
  pattern: string,
  baseFileSize: number,
): SplitPartInfo[] {
  if (totalPages <= 0) return [];
  if (mode === 'ranges') return resolveRangeParts(ranges, totalPages, pattern, baseFileSize);
  if (mode === 'every') return resolveEveryParts(totalPages, pattern, baseFileSize);
  if (mode === 'chunks') return resolveChunkParts(chunkSize, totalPages, pattern, baseFileSize);
  return [
    {
      index: 1,
      name: 'Extracted-Pages.pdf',
      startPage: 1,
      endPage: 4,
      pageCount: 4,
      sizeBytes: Math.round((baseFileSize / totalPages) * 4),
    },
  ];
}

async function generateSplitZipEntries(
  parts: SplitPartInfo[],
  fileName: string,
  totalPages: number,
  fileBytes: Uint8Array | null,
): Promise<ZipEntry[]> {
  const rawBytes = fileBytes ?? (await createSamplePdf(fileName, totalPages));
  const srcDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
  const zipEntries: ZipEntry[] = [];

  for (const part of parts) {
    const subDoc = await PDFDocument.create();
    const startIdx = Math.max(0, part.startPage - 1);
    const endIdx = Math.min(srcDoc.getPageCount() - 1, part.endPage - 1);
    const indices = Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i);
    const copied = await subDoc.copyPages(srcDoc, indices);
    for (const p of copied) subDoc.addPage(p);
    const partBytes = await subDoc.save();
    zipEntries.push({ name: part.name, data: partBytes });
  }

  return zipEntries;
}

function usePdfSplitOptions() {
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState<SplitRange[]>([
    { id: 'r1', start: 1, end: 12 },
    { id: 'r2', start: 13, end: 42 },
    { id: 'r3', start: 43, end: 78 },
    { id: 'r4', start: 79, end: 124 },
  ]);
  const [extractInput, setExtractInput] = useState('1, 3, 5-12');
  const [chunkSize, setChunkSize] = useState(10);
  const [keepBookmarks, setKeepBookmarks] = useState(true);
  const [separateFiles, setSeparateFiles] = useState(true);
  const [compressOutput, setCompressOutput] = useState(false);
  const [pattern, setPattern] = useState('Audit-Report-2025_Part_{n}');
  const [downloadAsZip, setDownloadAsZip] = useState(true);

  return {
    mode,
    setMode,
    ranges,
    setRanges,
    extractInput,
    setExtractInput,
    chunkSize,
    setChunkSize,
    keepBookmarks,
    setKeepBookmarks,
    separateFiles,
    setSeparateFiles,
    compressOutput,
    setCompressOutput,
    pattern,
    setPattern,
    downloadAsZip,
    setDownloadAsZip,
  };
}

function useSplitFileState(notify?: (msg: string) => void) {
  const [fileName, setFileName] = useState(SAMPLE_SPLIT_FILE.name);
  const [fileSizeBytes, setFileSizeBytes] = useState(SAMPLE_SPLIT_FILE.sizeBytes);
  const [totalPages, setTotalPages] = useState(SAMPLE_SPLIT_FILE.pageCount);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    setFileName(SAMPLE_SPLIT_FILE.name);
    setFileSizeBytes(SAMPLE_SPLIT_FILE.sizeBytes);
    setTotalPages(SAMPLE_SPLIT_FILE.pageCount);
  }, []);

  return {
    fileName,
    fileSizeBytes,
    totalPages,
    fileBytes,
    clearAll: () => {
      setFileName('');
      setTotalPages(0);
    },
    loadSampleSplit: () => {
      setFileName(SAMPLE_SPLIT_FILE.name);
      setFileSizeBytes(SAMPLE_SPLIT_FILE.sizeBytes);
      setTotalPages(SAMPLE_SPLIT_FILE.pageCount);
      setFileBytes(null);
    },
    loadHeavyBookSample: () => {
      setFileName(SAMPLE_HEAVY_BOOK_FILE.name);
      setFileSizeBytes(SAMPLE_HEAVY_BOOK_FILE.sizeBytes);
      setTotalPages(SAMPLE_HEAVY_BOOK_FILE.pageCount);
      setFileBytes(null);
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
        notify?.('Failed to read PDF.');
      }
    },
  };
}

function useSplitActions(
  fileState: ReturnType<typeof useSplitFileState>,
  opts: ReturnType<typeof usePdfSplitOptions>,
  notify?: (msg: string) => void,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedBlobUrl, setGeneratedBlobUrl] = useState<string | null>(null);

  async function executeSplit() {
    if (fileState.totalPages <= 0) return;
    setIsProcessing(true);
    try {
      const parts = resolveSplitParts(
        opts.mode,
        fileState.totalPages,
        opts.ranges,
        opts.extractInput,
        opts.chunkSize,
        opts.pattern,
        fileState.fileSizeBytes,
      );
      const zipEntries = await generateSplitZipEntries(
        parts,
        fileState.fileName,
        fileState.totalPages,
        fileState.fileBytes,
      );
      const isZip = opts.downloadAsZip || zipEntries.length > 1;
      const data = isZip ? buildZipArchive(zipEntries) : zipEntries[0]?.data || new Uint8Array();
      setGeneratedBlobUrl(
        URL.createObjectURL(
          new Blob([data as BlobPart], { type: isZip ? 'application/zip' : 'application/pdf' }),
        ),
      );
      notify?.('PDF split completed successfully!');
    } catch {
      notify?.('Split operation failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadResult() {
    if (!generatedBlobUrl) {
      void executeSplit();
      return;
    }
    const a = document.createElement('a');
    a.href = generatedBlobUrl;
    a.download = opts.downloadAsZip
      ? `${fileState.fileName.replace(/\.[^/.]+$/, '')}-split.zip`
      : 'Split-Part-1.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return { isProcessing, generatedBlobUrl, executeSplit, downloadResult };
}

export function usePdfSplitStudio(notify?: (msg: string) => void) {
  const fileState = useSplitFileState(notify);
  const opts = usePdfSplitOptions();
  const actions = useSplitActions(fileState, opts, notify);

  return {
    ...fileState,
    ...opts,
    ...actions,
    parts: resolveSplitParts(
      opts.mode,
      fileState.totalPages,
      opts.ranges,
      opts.extractInput,
      opts.chunkSize,
      opts.pattern,
      fileState.fileSizeBytes,
    ),
    addRange: () => {
      const last = opts.ranges[opts.ranges.length - 1];
      const nextStart = last ? Math.min(last.end + 1, fileState.totalPages) : 1;
      opts.setRanges((p) => [
        ...p,
        {
          id: `r-${Date.now()}`,
          start: nextStart,
          end: Math.min(nextStart + 10, fileState.totalPages),
        },
      ]);
    },
    removeRange: (id: string) => opts.setRanges((p) => p.filter((r) => r.id !== id)),
    splitHeavyBookIntoChapters: () => {
      fileState.loadHeavyBookSample();
      opts.setMode('chunks');
      opts.setChunkSize(100);
      opts.setPattern('Textbook_Chapter_{n}');
      notify?.('Loaded 1,600-page book: 16 chapters of 100 pages each ready to split!');
    },
    copySummary: () => {
      void navigator.clipboard.writeText(
        `BeyondTheAI PDF Split: ${fileState.fileName} (${fileState.totalPages} pages), Mode: ${opts.mode}`,
      );
      notify?.('Split summary copied!');
    },
  };
}
