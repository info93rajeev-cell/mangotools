import { degrees, PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import { createSamplePdf, SAMPLE_MERGE_FILES } from './samplePdfDocuments.ts';

export interface MergedFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  pageCount: number;
  bytes?: Uint8Array;
  rotation: number;
  themeColor: string;
}

export interface MergeSummary {
  fileCount: number;
  totalPageCount: number;
  totalSizeBytes: number;
  hasBookmarks: boolean;
  ranges: { name: string; start: number; end: number }[];
}

const COLOR_PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#06b6d4'];

export function calculateMergeSummary(
  files: MergedFileItem[],
  addBookmarks: boolean,
): MergeSummary {
  let totalPageCount = 0;
  let totalSizeBytes = 0;
  let currentPage = 1;
  const ranges: { name: string; start: number; end: number }[] = [];

  for (const f of files) {
    const start = currentPage;
    const end = currentPage + f.pageCount - 1;
    ranges.push({ name: f.name.replace(/\.[^/.]+$/, ''), start, end });
    currentPage += f.pageCount;
    totalPageCount += f.pageCount;
    totalSizeBytes += f.sizeBytes;
  }

  return {
    fileCount: files.length,
    totalPageCount,
    totalSizeBytes,
    hasBookmarks: addBookmarks,
    ranges,
  };
}

interface LoadedDoc {
  doc: PDFDocument;
  rotation: number;
  count: number;
}

async function copyConcatenatePages(merged: PDFDocument, items: LoadedDoc[]) {
  for (const item of items) {
    const pageIndices = Array.from({ length: item.count }, (_, i) => i);
    const copied = await merged.copyPages(item.doc, pageIndices);
    for (const p of copied) {
      if (item.rotation) p.setRotation(degrees(p.getRotation().angle + item.rotation));
      merged.addPage(p);
    }
  }
}

async function copyInterleavePages(merged: PDFDocument, items: LoadedDoc[]) {
  const maxPages = Math.max(...items.map((d) => d.count), 0);
  for (let pIdx = 0; pIdx < maxPages; pIdx++) {
    for (const item of items) {
      if (pIdx < item.count) {
        const [copied] = await merged.copyPages(item.doc, [pIdx]);
        if (copied) {
          if (item.rotation)
            copied.setRotation(degrees(copied.getRotation().angle + item.rotation));
          merged.addPage(copied);
        }
      }
    }
  }
}

async function performPdfMerge(
  files: MergedFileItem[],
  method: 'concatenate' | 'interleave',
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const loadedDocs: LoadedDoc[] = [];

  for (const f of files) {
    const rawBytes = f.bytes ?? (await createSamplePdf(f.name, f.pageCount));
    const srcDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
    loadedDocs.push({ doc: srcDoc, rotation: f.rotation, count: srcDoc.getPageCount() });
  }

  if (method === 'concatenate') {
    await copyConcatenatePages(merged, loadedDocs);
  } else {
    await copyInterleavePages(merged, loadedDocs);
  }

  return merged.save();
}

function useMergeFileCollection(notify?: (msg: string) => void) {
  const [files, setFiles] = useState<MergedFileItem[]>([]);

  function loadSampleFiles() {
    setFiles(
      SAMPLE_MERGE_FILES.map((meta, i) => ({
        id: `sample-${i}-${meta.name}`,
        name: meta.name,
        sizeBytes: meta.sizeBytes,
        pageCount: meta.pageCount,
        rotation: 0,
        themeColor: meta.themeColor,
      })),
    );
    notify?.('Sample documents loaded.');
  }

  async function handleAddNativeFiles(fileList: FileList | File[]) {
    const incoming: MergedFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file) continue;
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        incoming.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          sizeBytes: file.size,
          pageCount: doc.getPageCount(),
          bytes,
          rotation: 0,
          themeColor: COLOR_PALETTE[(files.length + i) % COLOR_PALETTE.length] || '#ef4444',
        });
      } catch {
        notify?.(`Could not parse ${file.name} as a valid PDF.`);
      }
    }
    if (incoming.length > 0) setFiles((prev) => [...prev, ...incoming]);
  }

  return {
    files,
    setFiles,
    loadSampleFiles,
    handleAddNativeFiles,
    removeFile: (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx)),
    rotateFile: (idx: number) =>
      setFiles((p) =>
        p.map((f, i) => (i === idx ? { ...f, rotation: (f.rotation + 90) % 360 } : f)),
      ),
    moveFile: (from: number, to: number) => {
      setFiles((p) => {
        const clone = [...p];
        const [item] = clone.splice(from, 1);
        if (item) clone.splice(to, 0, item);
        return clone;
      });
    },
    clearAll: () => setFiles([]),
  };
}

export function usePdfMergeStudio(notify?: (msg: string) => void) {
  const fileCol = useMergeFileCollection(notify);
  const [mergeMethod, setMergeMethod] = useState<'concatenate' | 'interleave'>('concatenate');
  const [addBookmarks, setAddBookmarks] = useState(true);
  const [outputFileName, setOutputFileName] = useState('Merged-Document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    fileCol.loadSampleFiles();
  }, []);

  async function executeMerge() {
    if (fileCol.files.length === 0) return;
    setIsProcessing(true);
    try {
      const bytes = await performPdfMerge(fileCol.files, mergeMethod);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      setMergedBlobUrl(url);
      notify?.('PDFs merged successfully!');
    } catch {
      notify?.('Failed to merge PDFs.');
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    ...fileCol,
    mergeMethod,
    setMergeMethod,
    addBookmarks,
    setAddBookmarks,
    outputFileName,
    setOutputFileName,
    isProcessing,
    mergedBlobUrl,
    summary: calculateMergeSummary(fileCol.files, addBookmarks),
    executeMerge,
    downloadMerged: () => {
      if (!mergedBlobUrl) {
        void executeMerge();
        return;
      }
      const a = document.createElement('a');
      a.href = mergedBlobUrl;
      a.download = outputFileName || 'Merged-Document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    copySummary: () => {
      const s = calculateMergeSummary(fileCol.files, addBookmarks);
      const text = `BeyondTheAI PDF Merge: Files: ${s.fileCount}, Pages: ${s.totalPageCount}, Size: ${(s.totalSizeBytes / 1048576).toFixed(1)} MB`;
      void navigator.clipboard.writeText(text);
      notify?.('Summary copied to clipboard!');
    },
  };
}
