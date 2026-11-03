import { PDFDocument } from 'pdf-lib';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { buildZipArchive, type ZipEntry } from './docxZipPacker.ts';
import { openUserPdf } from './pdfInput.ts';
import {
  defaultRanges,
  parsePageList,
  resolveSplitParts,
  type SplitMode,
  type SplitPartInfo,
  type SplitRange,
} from './pdfSplitPlan.ts';
import {
  createSamplePdf,
  SAMPLE_HEAVY_BOOK_FILE,
  SAMPLE_SPLIT_FILE,
} from './samplePdfDocuments.ts';

export type { SplitMode, SplitPartInfo, SplitRange } from './pdfSplitPlan.ts';

export async function buildSplitFiles(
  source: Uint8Array,
  parts: SplitPartInfo[],
): Promise<ZipEntry[]> {
  const src = await PDFDocument.load(source, { ignoreEncryption: true, updateMetadata: false });
  const out: ZipEntry[] = [];
  for (const part of parts) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(
      src,
      part.pages.map((p) => p - 1),
    );
    for (const p of pages) doc.addPage(p);
    out.push({ name: part.name, data: await doc.save() });
  }
  return out;
}

function useSplitFileState(notify?: (msg: string) => void) {
  const [fileName, setFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const take = async (name: string, bytes: Uint8Array) => {
    const opened = await openUserPdf(name, bytes);
    if (!opened.ok) {
      notify?.(opened.message);
      return 0;
    }
    setFileName(name);
    setFileSizeBytes(bytes.length);
    setTotalPages(opened.doc.getPageCount());
    setFileBytes(bytes);
    return opened.doc.getPageCount();
  };
  return {
    fileName,
    fileSizeBytes,
    totalPages,
    fileBytes,
    take,
    clearAll: () => {
      setFileName('');
      setTotalPages(0);
      setFileSizeBytes(0);
      setFileBytes(null);
    },
  };
}

function usePdfSplitOptions() {
  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState<SplitRange[]>([]);
  const [extractInput, setExtractInput] = useState('1');
  const [chunkSize, setChunkSize] = useState(10);
  const [pattern, setPattern] = useState('Part_{n}');
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
    pattern,
    setPattern,
    downloadAsZip,
    setDownloadAsZip,
  };
}

function saveFile(data: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type FileState = ReturnType<typeof useSplitFileState>;
type Options = ReturnType<typeof usePdfSplitOptions>;

function useSplitActions(
  file: FileState,
  opts: Options,
  parts: SplitPartInfo[],
  notify?: (m: string) => void,
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ZipEntry[] | null>(null);
  useEffect(() => setResult(null), [file.fileBytes, parts]);
  const base = file.fileName.replace(/\.[^/.]+$/, '') || 'document';

  async function executeSplit(): Promise<ZipEntry[] | null> {
    if (!file.fileBytes) return null;
    if (parts.length === 0) {
      notify?.('Nothing to split: check the page ranges or page list.');
      return null;
    }
    setIsProcessing(true);
    try {
      const files = await buildSplitFiles(file.fileBytes, parts);
      setResult(files);
      notify?.(`Created ${files.length} PDF file${files.length === 1 ? '' : 's'}.`);
      return files;
    } catch {
      notify?.('Split failed. The PDF may be damaged or protected.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  async function downloadResult() {
    const files = result ?? (await executeSplit());
    if (!files || files.length === 0) return;
    if (files.length === 1 && files[0]) saveFile(files[0].data, files[0].name, 'application/pdf');
    else if (opts.downloadAsZip)
      saveFile(buildZipArchive(files), `${base}-split.zip`, 'application/zip');
    else for (const f of files) saveFile(f.data, f.name, 'application/pdf');
  }

  return {
    isProcessing,
    generatedBlobUrl: result ? 'ready' : null,
    result,
    executeSplit,
    downloadResult,
  };
}

function rangeActions(opts: Options, totalPages: number) {
  return {
    addRange: () => {
      const last = opts.ranges[opts.ranges.length - 1];
      const start = Math.min((last?.end ?? 0) + 1, totalPages || 1);
      const end = Math.min(start + 9, totalPages || start);
      opts.setRanges((p) => [...p, { id: `r-${p.length + 1}-${start}`, start, end }]);
    },
    removeRange: (id: string) => opts.setRanges((p) => p.filter((r) => r.id !== id)),
  };
}

function togglePage(prev: string, pg: number): string {
  const tokens = prev
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const str = String(pg);
  return tokens.includes(str)
    ? tokens.filter((s) => s !== str).join(', ')
    : [...tokens, str].join(', ');
}

function useSplitParts(file: FileState, opts: Options): SplitPartInfo[] {
  const { mode, ranges, extractInput, chunkSize, pattern } = opts;
  const { totalPages, fileSizeBytes, fileName } = file;
  return useMemo(
    () =>
      resolveSplitParts({
        mode,
        totalPages,
        ranges,
        extractInput,
        chunkSize,
        pattern,
        baseFileSize: fileSizeBytes,
        baseName: fileName.replace(/\.[^/.]+$/, '') || 'document',
      }),
    [mode, totalPages, ranges, extractInput, chunkSize, pattern, fileSizeBytes, fileName],
  );
}

export function usePdfSplitStudio(notify?: (msg: string) => void) {
  const file = useSplitFileState(notify);
  const opts = usePdfSplitOptions();
  const [selectedPage, setSelectedPage] = useState(1);
  const parts = useSplitParts(file, opts);
  const actions = useSplitActions(file, opts, parts, notify);

  const open = async (name: string, bytes: Uint8Array) => {
    const pages = await file.take(name, bytes);
    if (pages > 0) {
      opts.setRanges(defaultRanges(pages));
      opts.setExtractInput('1');
      notify?.(`Loaded ${name} (${pages} pages)`);
    }
    return pages;
  };
  const loadSample = async (meta: { name: string; pageCount: number }) =>
    open(meta.name, await createSamplePdf(meta.name.replace(/\.pdf$/i, ''), meta.pageCount));

  return {
    ...file,
    ...opts,
    ...actions,
    parts,
    invalidPages:
      opts.mode === 'extract' ? parsePageList(opts.extractInput, file.totalPages).invalid : [],
    selectedPage,
    setSelectedPage,
    onSelectPage: (pg: number) => {
      setSelectedPage(pg);
      if (opts.mode === 'extract') opts.setExtractInput((p) => togglePage(p, pg));
    },
    loadSampleSplit: () => void loadSample(SAMPLE_SPLIT_FILE),
    handleAddNativeFile: async (f: File | undefined) => {
      if (f) await open(f.name, new Uint8Array(await f.arrayBuffer()));
    },
    ...rangeActions(opts, file.totalPages),
    splitHeavyBookIntoChapters: async () => {
      if ((await loadSample(SAMPLE_HEAVY_BOOK_FILE)) === 0) return;
      opts.setMode('chunks');
      opts.setChunkSize(100);
      opts.setPattern('Textbook_Chapter_{n}');
    },
    copySummary: () => {
      const n = parts.length;
      void navigator.clipboard?.writeText(
        `${file.fileName} (${file.totalPages} pages): ${n} output file(s).`,
      );
      notify?.('Summary copied');
    },
  };
}
