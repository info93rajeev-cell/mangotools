import { useEffect, useState } from 'preact/hooks';
import { buildDocxFromBlocks, type DocxBlock } from './docxZipPacker.ts';
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
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [keepHeadings, setKeepHeadings] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(true);
  const [previewTab, setPreviewTab] = useState<'text' | 'outline'>('text');
  return {
    fileName,
    setFileName,
    fileSizeBytes,
    setFileSizeBytes,
    extraction,
    setExtraction,
    keepHeadings,
    setKeepHeadings,
    pageBreaks,
    setPageBreaks,
    previewTab,
    setPreviewTab,
  };
}

export function usePdfToWordStudio(notify?: (msg: string) => void) {
  const s = usePdfToWordState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [docx, setDocx] = useState<Uint8Array | null>(null);
  useEffect(() => setDocx(null), [s.extraction, s.keepHeadings, s.pageBreaks]);

  const take = async (name: string, bytes: Uint8Array) => {
    setIsProcessing(true);
    try {
      const pages = await extractPdfText(bytes);
      s.setFileName(name);
      s.setFileSizeBytes(bytes.length);
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
    if (ex.words === 0) {
      notify?.('No selectable text was found. Scanned PDFs need OCR, which this tool does not do.');
      return null;
    }
    const bytes = buildDocxFromBlocks(docxBlocks(ex.blocks, s));
    setDocx(bytes);
    notify?.(`Converted ${ex.words} words to an editable Word document.`);
    return bytes;
  };

  const outName = `${s.fileName.replace(/\.[^/.]+$/, '') || 'document'}.docx`;

  return {
    ...s,
    totalPages: s.extraction?.pages.length ?? 0,
    isProcessing,
    docx,
    executeConvertToWord: async () => convert(),
    clearAll: () => {
      s.setFileName('');
      s.setFileSizeBytes(0);
      s.setExtraction(null);
    },
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
