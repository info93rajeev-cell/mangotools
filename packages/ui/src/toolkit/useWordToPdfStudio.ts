import { useEffect, useState } from 'preact/hooks';
import { type DocxContent, readDocx } from './docxReader.ts';
import { type Margins, type PageSize, renderDocxToPdf } from './docxToPdf.ts';
import { buildDocxFromBlocks } from './docxZipPacker.ts';
import { SAMPLE_WORD_DOCS } from './sampleWordDocs.ts';

export interface WordFile {
  id: string;
  name: string;
  sizeBytes: number;
  content: DocxContent;
  pages: number;
  words: number;
  /** This file laid out on its own with the current settings, for the page previews. */
  preview: Uint8Array;
}

function wordCount(c: DocxContent): number {
  return c.paragraphs
    .flatMap((p) => p.runs.map((r) => r.text))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function save(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const pdfName = (name: string) => `${name.replace(/\.[^/.]+$/, '')}.pdf`;

async function readWordFiles(
  list: { name: string; bytes: Uint8Array }[],
  startIndex: number,
  opts: { pageSize: PageSize; margins: Margins },
  notify?: (msg: string) => void,
): Promise<WordFile[]> {
  const added: WordFile[] = [];
  for (const f of list) {
    if (!/\.docx$/i.test(f.name)) {
      notify?.(`${f.name}: only .docx files can be converted (not the older .doc format).`);
      continue;
    }
    try {
      const content = await readDocx(f.bytes);
      const r = await renderDocxToPdf([content], opts);
      const id = `word-${startIndex + added.length}-${f.name}`;
      added.push({
        id,
        name: f.name,
        sizeBytes: f.bytes.length,
        content,
        pages: r.pages,
        words: wordCount(content),
        preview: r.bytes,
      });
    } catch {
      notify?.(`${f.name} could not be read as a Word document.`);
    }
  }
  return added;
}

async function renderGroups(
  files: WordFile[],
  exportMode: 'single' | 'separate',
  opts: { pageSize: PageSize; margins: Margins },
): Promise<Converted[]> {
  const groups = exportMode === 'single' ? [files] : files.map((f) => [f]);
  const out: Converted[] = [];
  for (const g of groups) {
    const r = await renderDocxToPdf(
      g.map((f) => f.content),
      opts,
    );
    const name = g.length === 1 && g[0] ? pdfName(g[0].name) : 'Combined-Word-Documents.pdf';
    out.push({ bytes: r.bytes, name, pages: r.pages, replacedChars: r.replacedChars });
  }
  return out;
}

/** Page counts and previews depend on page size and margins, so they are redone when those change. */
function useRecountPages(
  files: WordFile[],
  setFiles: (f: WordFile[]) => void,
  pageSize: PageSize,
  margins: Margins,
) {
  useEffect(() => {
    let current = true;
    void Promise.all(
      files.map(async (f) => {
        const r = await renderDocxToPdf([f.content], { pageSize, margins });
        return { ...f, pages: r.pages, preview: r.bytes };
      }),
    ).then((updated) => {
      if (current && updated.length > 0) setFiles(updated);
    });
    return () => {
      current = false;
    };
  }, [pageSize, margins]);
}

export interface Converted {
  bytes: Uint8Array;
  name: string;
  pages: number;
  replacedChars: number;
}

export function useWordToPdfStudio(notify?: (msg: string) => void) {
  const [files, setFiles] = useState<WordFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [margins, setMargins] = useState<Margins>('Standard');
  const [exportMode, setExportMode] = useState<'single' | 'separate'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<Converted[] | null>(null);
  useEffect(() => setOutput(null), [files, pageSize, margins, exportMode]);
  useRecountPages(files, setFiles, pageSize, margins);
  const add = async (list: { name: string; bytes: Uint8Array }[]) => {
    const added = await readWordFiles(list, files.length, { pageSize, margins }, notify);
    if (added.length > 0) {
      setFiles((prev) => [...prev, ...added]);
      notify?.(`Added ${added.length} Word file${added.length === 1 ? '' : 's'}`);
    }
  };

  const convert = async (): Promise<Converted[] | null> => {
    if (files.length === 0) return null;
    setIsProcessing(true);
    try {
      const out = await renderGroups(files, exportMode, { pageSize, margins });
      setOutput(out);
      const replaced = out.reduce((n, o) => n + o.replacedChars, 0);
      notify?.(
        replaced > 0
          ? `PDF created; ${replaced} unsupported characters shown as "?".`
          : 'PDF created.',
      );
      return out;
    } catch {
      notify?.('The PDF could not be created.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    files,
    setFiles,
    pageSize,
    setPageSize,
    margins,
    setMargins,
    exportMode,
    setExportMode,
    isProcessing,
    output,
    executeWordToPdf: convert,
    clearAll: () => setFiles([]),
    downloadPdf: async () => {
      const out = output ?? (await convert());
      for (const o of out ?? []) save(o.bytes, o.name);
    },
    copySummary: () => {
      const words = files.reduce((n, f) => n + f.words, 0);
      void navigator.clipboard?.writeText(`Word to PDF: ${files.length} files, ${words} words.`);
      notify?.('Summary copied');
    },
    loadSampleWordDocs: async () =>
      add(SAMPLE_WORD_DOCS.map((d) => ({ name: d.name, bytes: buildDocxFromBlocks(d.blocks) }))),
    handleAddNativeFiles: async (fileList: FileList | File[]) =>
      add(
        await Promise.all(
          Array.from(fileList).map(async (f) => ({
            name: f.name,
            bytes: new Uint8Array(await f.arrayBuffer()),
          })),
        ),
      ),
  };
}
