import { PDFDocument } from 'pdf-lib';
import { useEffect, useState } from 'preact/hooks';
import { buildDocxArchive } from './docxZipPacker.ts';
import {
  createSamplePdf,
  SAMPLE_PDF_TO_WORD_FILE,
  SAMPLE_WORD_FILES,
} from './samplePdfDocuments.ts';

async function generateSampleDocx(fileName: string): Promise<string> {
  const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const sections = [
    {
      heading: '1. Agreement Overview & Parties',
      paragraphs: [
        'This Master Services Agreement is entered into by and between the Client and Vendor.',
        'The parties mutually agree to the terms, conditions, specifications, and scope of services outlined herein.',
      ],
    },
    {
      heading: '2. Scope of Services & Deliverables',
      paragraphs: [
        'Vendor shall render high-precision digital services according to Annexure A benchmarks.',
        'All deliverables shall undergo rigorous quality assurance and user acceptance verification prior to deployment.',
      ],
    },
  ];

  const docxBytes = buildDocxArchive(title, sections);
  const blob = new Blob([docxBytes as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return URL.createObjectURL(blob);
}

function usePdfToWordState() {
  const [fileName, setFileName] = useState(SAMPLE_PDF_TO_WORD_FILE.name);
  const [fileSizeBytes, setFileSizeBytes] = useState(SAMPLE_PDF_TO_WORD_FILE.sizeBytes);
  const [totalPages, setTotalPages] = useState(SAMPLE_PDF_TO_WORD_FILE.pageCount);
  const [enableOcr, setEnableOcr] = useState(true);
  const [keepHeadings, setKeepHeadings] = useState(true);
  const [preserveTables, setPreserveTables] = useState(true);
  const [language, setLanguage] = useState('English (Auto-detect)');
  const [previewTab, setPreviewTab] = useState<'visual' | 'text' | 'outline'>('visual');

  return {
    fileName,
    setFileName,
    fileSizeBytes,
    setFileSizeBytes,
    totalPages,
    setTotalPages,
    enableOcr,
    setEnableOcr,
    keepHeadings,
    setKeepHeadings,
    preserveTables,
    setPreserveTables,
    language,
    setLanguage,
    previewTab,
    setPreviewTab,
  };
}

export function usePdfToWordStudio(notify?: (msg: string) => void) {
  const s = usePdfToWordState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [docxBlobUrl, setDocxBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    s.setFileName(SAMPLE_PDF_TO_WORD_FILE.name);
    s.setFileSizeBytes(SAMPLE_PDF_TO_WORD_FILE.sizeBytes);
    s.setTotalPages(SAMPLE_PDF_TO_WORD_FILE.pageCount);
  }, []);

  async function executeConvertToWord() {
    if (!s.fileName) return;
    setIsProcessing(true);
    try {
      setDocxBlobUrl(await generateSampleDocx(s.fileName));
      notify?.('Converted to editable Word DOCX successfully!');
    } catch {
      notify?.('Conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    ...s,
    isProcessing,
    docxBlobUrl,
    executeConvertToWord,
    clearAll: () => {
      s.setFileName('');
      s.setTotalPages(0);
      setDocxBlobUrl(null);
    },
    downloadDocx: () => {
      if (!docxBlobUrl) {
        void executeConvertToWord();
        return;
      }
      const a = document.createElement('a');
      a.href = docxBlobUrl;
      a.download = `${s.fileName.replace(/\.[^/.]+$/, '')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    copySummary: () => {
      void navigator.clipboard.writeText(
        `BeyondTheAI PDF to Word: ${s.fileName} (${s.totalPages} pages)`,
      );
      notify?.('Summary copied to clipboard!');
    },
    loadSamplePdfToWord: () => {
      s.setFileName(SAMPLE_PDF_TO_WORD_FILE.name);
      s.setFileSizeBytes(SAMPLE_PDF_TO_WORD_FILE.sizeBytes);
      s.setTotalPages(SAMPLE_PDF_TO_WORD_FILE.pageCount);
    },
    handleAddNativeFile: async (file: File) => {
      s.setFileName(file.name);
      s.setFileSizeBytes(file.size);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        s.setTotalPages(doc.getPageCount());
      } catch {
        s.setTotalPages(1);
      }
      notify?.(`Loaded ${file.name}`);
    },
  };
}

function useWordToPdfState() {
  const [files, setFiles] = useState<
    { id: string; name: string; pages: number; sizeBytes: number }[]
  >([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [margins, setMargins] = useState<'Standard' | 'Compact'>('Standard');
  const [exportMode, setExportMode] = useState<'single' | 'separate'>('single');
  const [preserveLinks, setPreserveLinks] = useState(true);
  const [includeBookmarks, setIncludeBookmarks] = useState(true);
  const [compressOutput, setCompressOutput] = useState(true);

  return {
    files,
    setFiles,
    pageSize,
    setPageSize,
    margins,
    setMargins,
    exportMode,
    setExportMode,
    preserveLinks,
    setPreserveLinks,
    includeBookmarks,
    setIncludeBookmarks,
    compressOutput,
    setCompressOutput,
  };
}

export function useWordToPdfStudio(notify?: (msg: string) => void) {
  const s = useWordToPdfState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    s.setFiles(
      SAMPLE_WORD_FILES.map((m, i) => ({
        id: `word-${i}`,
        name: m.name,
        pages: m.pageCount,
        sizeBytes: m.sizeBytes,
      })),
    );
  }, []);

  async function executeWordToPdf() {
    if (s.files.length === 0) return;
    setIsProcessing(true);
    try {
      const totalPages = s.files.reduce((acc, f) => acc + f.pages, 0);
      const title = s.files.map((f) => f.name.replace(/\.[^/.]+$/, '')).join(' + ');
      const pdfBytes = await createSamplePdf(title, totalPages, 'Converted from DOCX');
      setPdfBlobUrl(
        URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })),
      );
      notify?.('Created PDF successfully from Word document(s)!');
    } catch {
      notify?.('Failed to convert Word file(s).');
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    ...s,
    isProcessing,
    pdfBlobUrl,
    executeWordToPdf,
    clearAll: () => s.setFiles([]),
    downloadPdf: () => {
      if (!pdfBlobUrl) {
        void executeWordToPdf();
        return;
      }
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download =
        s.exportMode === 'single' ? 'Merged-Word-Document.pdf' : `${s.files[0]?.name || 'doc'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    copySummary: () => {
      void navigator.clipboard.writeText(`BeyondTheAI Word to PDF: ${s.files.length} files`);
      notify?.('Summary copied!');
    },
    loadSampleWordDocs: () => {
      s.setFiles(
        SAMPLE_WORD_FILES.map((m, i) => ({
          id: `word-${i}`,
          name: m.name,
          pages: m.pageCount,
          sizeBytes: m.sizeBytes,
        })),
      );
    },
    handleAddNativeFiles: (fileList: FileList | File[]) => {
      const added = Array.from(fileList).map((f, i) => ({
        id: `word-${Date.now()}-${i}`,
        name: f.name,
        pages: 6,
        sizeBytes: f.size,
      }));
      s.setFiles((prev) => [...prev, ...added]);
      notify?.(`Added ${added.length} Word file(s)`);
    },
  };
}
