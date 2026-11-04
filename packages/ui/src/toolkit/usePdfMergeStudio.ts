import { degrees, PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import { mergeCapacity, openUserPdf } from './pdfInput.ts';
import { addOutline } from './pdfOutline.ts';
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

/** First page index of each file in the merged order. */
export function startPages(counts: number[], method: 'concatenate' | 'interleave'): number[] {
  if (method === 'concatenate') {
    let at = 0;
    return counts.map((c) => {
      const start = at;
      at += c;
      return start;
    });
  }
  // Interleaved: page 1 of every file comes first, in file order (files with no pages are skipped).
  let at = 0;
  return counts.map((c) => (c > 0 ? at++ : -1));
}

export async function performPdfMerge(
  files: MergedFileItem[],
  method: 'concatenate' | 'interleave',
  bookmarks = false,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const loadedDocs: LoadedDoc[] = [];

  for (const f of files) {
    if (!f.bytes) throw new Error(`No file data for ${f.name}`);
    const srcDoc = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
    loadedDocs.push({ doc: srcDoc, rotation: f.rotation, count: srcDoc.getPageCount() });
  }

  if (method === 'concatenate') {
    await copyConcatenatePages(merged, loadedDocs);
  } else {
    await copyInterleavePages(merged, loadedDocs);
  }
  if (bookmarks) {
    const starts = startPages(
      loadedDocs.map((d) => d.count),
      method,
    );
    addOutline(
      merged,
      files.map((f, i) => ({ title: f.name.replace(/\.[^/.]+$/, ''), pageIndex: starts[i] ?? -1 })),
    );
  }

  return merged.save();
}

function useMergeFileCollection(notify?: (msg: string) => void) {
  const [files, setFiles] = useState<MergedFileItem[]>([]);

  async function loadSampleFiles() {
    const samples: MergedFileItem[] = [];
    for (const [i, meta] of SAMPLE_MERGE_FILES.entries()) {
      const bytes = await createSamplePdf(
        meta.name.replace(/\.pdf$/i, ''),
        meta.pageCount,
        meta.summary,
        meta.themeColor,
      );
      samples.push({
        id: `sample-${i}-${meta.name}`,
        name: meta.name,
        sizeBytes: bytes.length,
        pageCount: meta.pageCount,
        bytes,
        rotation: 0,
        themeColor: meta.themeColor,
      });
    }
    setFiles(samples);
    notify?.('Sample documents loaded.');
  }

  async function handleAddNativeFiles(fileList: FileList | File[]) {
    const list = Array.from(fileList);
    const room = mergeCapacity(
      { count: files.length, bytes: files.reduce((n, f) => n + f.sizeBytes, 0) },
      list,
    );
    if (room.message) notify?.(room.message);
    const incoming: MergedFileItem[] = [];
    for (const [i, file] of list.slice(0, room.accepted).entries()) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const opened = await openUserPdf(file.name, bytes);
      if (!opened.ok) {
        notify?.(opened.message);
        continue;
      }
      incoming.push({
        id: `file-${files.length + i}-${file.name}`,
        name: file.name,
        sizeBytes: file.size,
        pageCount: opened.doc.getPageCount(),
        bytes,
        rotation: 0,
        themeColor: COLOR_PALETTE[(files.length + i) % COLOR_PALETTE.length] || '#ef4444',
      });
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
  // A merged file belongs to one set of files, order, rotation and settings.
  useEffect(() => setMergedBlobUrl(null), [fileCol.files, mergeMethod, addBookmarks]);

  async function executeMerge(): Promise<string | null> {
    if (fileCol.files.length === 0) return null;
    setIsProcessing(true);
    try {
      const bytes = await performPdfMerge(fileCol.files, mergeMethod, addBookmarks);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      setMergedBlobUrl(url);
      notify?.('PDFs merged successfully!');
      return url;
    } catch {
      notify?.('Failed to merge PDFs.');
      return null;
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
    downloadMerged: async () => {
      const url = mergedBlobUrl ?? (await executeMerge());
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
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
