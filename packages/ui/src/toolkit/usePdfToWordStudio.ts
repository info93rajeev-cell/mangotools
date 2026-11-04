import { useEffect, useState } from 'preact/hooks';
import { buildDocxFromBlocks, type DocxBlock } from './docxZipPacker.ts';
import { openUserPdf } from './pdfInput.ts';
import { parseRangeList } from './pdfSplitPlan.ts';
import { type Block, extractPdfText, type PageText, toBlocks } from './pdfTextExtract.ts';
import { createTextSamplePdf, SAMPLE_PDF_TO_WORD_NAME } from './samplePdfDocuments.ts';

export interface Extraction {
  pages: PageText[];
  blocks: Block[];
  pagesWithText: number;
  words: number;
  headings: number;
}

export function summarise(pages: PageText[]): Extraction {
  const blocks = toBlocks(pages);
  const text = blocks.map((b) => (b.kind === 'page' ? '' : b.text)).join(' ');
  return {
    pages,
    blocks,
    pagesWithText: pages.filter((p) => p.lines.length > 0).length,
    words: text.split(/\s+/).filter(Boolean).length,
    headings: blocks.filter((b) => b.kind === 'h1' || b.kind === 'h2').length,
  };
}

/** Blocks for the DOCX: headings flattened to paragraphs, page breaks optional. */
export function docxBlocks(
  blocks: Block[],
  opts: { keepHeadings: boolean; pageBreaks: boolean },
): DocxBlock[] {
  return blocks
    .filter((b) => opts.pageBreaks || b.kind !== 'page')
    .map((b) => (b.kind !== 'page' && !opts.keepHeadings ? { kind: 'p', text: b.text } : b));
}

export type PageMode = 'all' | 'custom';

/** The pages to convert: all of them, or the ones listed as "1-5, 8, 10-12". */
export function pickPages(
  pages: PageText[],
  mode: PageMode,
  text: string,
): { pages: PageText[]; invalid: string[] } {
  if (mode === 'all') return { pages, invalid: [] };
  const { ranges, invalid } = parseRangeList(text, pages.length);
  const keep = new Set<number>();
  for (const r of ranges) for (let p = r.start; p <= r.end; p++) keep.add(p);
  return { pages: pages.filter((_, i) => keep.has(i + 1)), invalid };
}

function save(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function usePdfToWordState() {
  const [fileName, setFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [keepHeadings, setKeepHeadings] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [previewTab, setPreviewTab] = useState<'visual' | 'text' | 'outline'>('visual');
  const [pageMode, setPageMode] = useState<PageMode>('all');
  const [pageRange, setPageRange] = useState('');
  return {
    fileName,
    setFileName,
    fileSizeBytes,
    setFileSizeBytes,
    fileBytes,
    setFileBytes,
    extraction,
    setExtraction,
    keepHeadings,
    setKeepHeadings,
    pageBreaks,
    setPageBreaks,
    previewTab,
    setPreviewTab,
    pageMode,
    setPageMode,
    pageRange,
    setPageRange,
  };
}

function resetState(s: ReturnType<typeof usePdfToWordState>) {
  s.setFileName('');
  s.setFileSizeBytes(0);
  s.setFileBytes(null);
  s.setExtraction(null);
  s.setPageMode('all');
  s.setPageRange('');
}

export function usePdfToWordStudio(notify?: (msg: string) => void) {
  const s = usePdfToWordState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [docx, setDocx] = useState<Uint8Array | null>(null);
  useEffect(
    () => setDocx(null),
    [s.extraction, s.keepHeadings, s.pageBreaks, s.pageMode, s.pageRange],
  );

  const take = async (name: string, bytes: Uint8Array) => {
    const opened = await openUserPdf(name, bytes, 200);
    if (!opened.ok) {
      notify?.(opened.message);
      return;
    }
    setIsProcessing(true);
    try {
      const pages = await extractPdfText(bytes);
      s.setFileName(name);
      s.setFileSizeBytes(bytes.length);
      s.setFileBytes(bytes);
      s.setExtraction(summarise(pages));
      notify?.(`Loaded ${name}`);
    } catch {
      notify?.('This file could not be read as a PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const convert = (): Uint8Array | null => {
    const ex = s.extraction;
    if (!ex) return null;
    const picked = pickPages(ex.pages, s.pageMode, s.pageRange);
    if (picked.pages.length === 0) {
      notify?.('Enter the pages to convert, for example 1-5, 8.');
      return null;
    }
    const part = summarise(picked.pages);
    if (part.words === 0) {
      notify?.('No selectable text was found. Scanned PDFs need OCR, which this tool does not do.');
      return null;
    }
    const bytes = buildDocxFromBlocks(docxBlocks(part.blocks, s));
    setDocx(bytes);
    notify?.(`Converted ${part.words} words to an editable Word document.`);
    return bytes;
  };

  const outName = `${s.fileName.replace(/\.[^/.]+$/, '') || 'document'}.docx`;

  return {
    ...s,
    totalPages: s.extraction?.pages.length ?? 0,
    isProcessing,
    docx,
    executeConvertToWord: async () => convert(),
    clearAll: () => resetState(s),
    downloadDocx: () => {
      const bytes = docx ?? convert();
      if (bytes) save(bytes, outName);
    },
    copySummary: () => {
      const ex = s.extraction;
      if (!ex) return;
      void navigator.clipboard?.writeText(
        `${s.fileName}: ${ex.pages.length} pages, text found on ${ex.pagesWithText}, ${ex.words} words, ${ex.headings} headings.`,
      );
      notify?.('Summary copied');
    },
    loadSamplePdfToWord: async () => take(SAMPLE_PDF_TO_WORD_NAME, await createTextSamplePdf()),
    handleAddNativeFile: async (file: File | undefined) => {
      if (file) await take(file.name, new Uint8Array(await file.arrayBuffer()));
    },
  };
}
