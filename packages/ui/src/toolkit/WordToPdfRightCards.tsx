import { RefInfoTable, RefPageStrip } from './PdfConvertParts.tsx';
import { RefActions, RefCardHead, RefPrivacy, RefStatus, RefTile } from './PdfRefParts.tsx';
import c from './pdfConvertRef.module.css';
import styles from './pdfRef.module.css';
import type { useWordToPdfStudio } from './useWordToPdfStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function statusOf(studio: WordToPdfState): { text: string; done: boolean } {
  if (studio.isProcessing) return { text: 'Creating…', done: false };
  if (studio.output) return { text: 'PDF created', done: true };
  if (studio.files.length > 0) return { text: 'Ready to convert', done: true };
  return { text: 'Add a .docx', done: false };
}

const PAGE_SIZE_LABEL = { A4: '210 × 297 mm', Letter: '8.5 × 11 in' } as const;

function totals(studio: WordToPdfState) {
  const { files, output } = studio;
  const pages = output
    ? output.reduce((n, o) => n + o.pages, 0)
    : files.reduce((n, f) => n + f.pages, 0);
  const bytes = output?.reduce((n, o) => n + o.bytes.length, 0) ?? 0;
  const size = output ? `${Math.max(1, Math.round(bytes / 1024))} KB` : '—';
  return { pages, size };
}

function SummarySection({ studio }: { studio: WordToPdfState }) {
  const { files, pageSize } = studio;
  const { pages, size } = totals(studio);
  const s = statusOf(studio);
  return (
    <section class={styles.card} aria-label="Export Summary">
      <RefCardHead
        icon="files"
        title="Export Summary"
        aside={<RefStatus text={s.text} done={s.done} />}
      />
      <div class={`${styles.tiles} ${styles.tilesBig}`}>
        <RefTile
          tone="purple"
          icon="file-text"
          label="Total pages"
          value={String(pages)}
          sub={`Across ${files.length} file${files.length === 1 ? '' : 's'}`}
        />
        <RefTile
          tone="green"
          icon="file-check"
          label="PDF size"
          value={size}
          sub="After creating"
        />
        <RefTile
          tone="blue"
          icon="file-output"
          label="Page size"
          value={pageSize}
          sub={PAGE_SIZE_LABEL[pageSize]}
        />
        <RefTile
          tone="amber"
          icon="circle-check"
          label={studio.output ? 'Created' : 'Status'}
          value={files.length > 0 ? 'Ready' : '—'}
          sub={studio.exportMode === 'single' ? 'Combined' : 'Separate'}
        />
      </div>
    </section>
  );
}

function ResultPreviewSection({ studio }: { studio: WordToPdfState }) {
  const { pages } = totals(studio);
  const n = studio.files.length;
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="Result Preview">
      <RefCardHead
        icon="eye"
        title="Result Preview"
        aside={
          <span class={styles.listMeta}>
            {pages} pages ({n} file{n === 1 ? '' : 's'})
          </span>
        }
      />
      {pages > 0 ? (
        <div class={c.stripWrap}>
          <RefPageStrip count={pages} max={5} />
        </div>
      ) : (
        <p class={styles.previewEmpty}>Add a .docx to see the PDF pages here.</p>
      )}
    </section>
  );
}

function carryNotes(studio: WordToPdfState): string[] {
  const images = studio.files.reduce((n, f) => n + f.content.images, 0);
  const tables = studio.files.reduce((n, f) => n + f.content.tables, 0);
  const replaced = studio.output?.reduce((n, o) => n + o.replacedChars, 0) ?? 0;
  const notes: string[] = [];
  if (images > 0) notes.push(`${images} image${images === 1 ? ' is' : 's are'} not included.`);
  if (tables > 0) {
    notes.push(
      `${tables} table${tables === 1 ? '' : 's'}: each row is written as one line, cells separated by “|”.`,
    );
  }
  if (replaced > 0) {
    notes.push(
      `${replaced} character${replaced === 1 ? '' : 's'} outside Western European text show as “?”.`,
    );
  }
  return notes;
}

function PdfInfoSection({ studio }: { studio: WordToPdfState }) {
  const { files, exportMode, pageSize } = studio;
  const { pages, size } = totals(studio);
  const words = files.reduce((n, f) => n + f.words, 0);
  const name =
    files.length === 0
      ? '—'
      : exportMode === 'separate' || files.length === 1
        ? `${files.length} PDF${files.length === 1 ? '' : 's'}, named after each file`
        : 'Combined-Word-Documents.pdf';
  const notes = carryNotes(studio);
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="PDF information">
      <RefCardHead icon="file-text" title="PDF Information" />
      <RefInfoTable
        rows={[
          ['File name', name],
          ['Content', `${files.length} Word file${files.length === 1 ? '' : 's'}, ${pages} pages`],
          ['Page size', `${pageSize} (${PAGE_SIZE_LABEL[pageSize]})`],
          ['Size', size === '—' ? 'Shown after creating' : size],
          ['Words', String(words)],
          ['Carries over', 'Text, headings, bold, italic, lists'],
        ]}
      />
      {notes.length > 0 ? (
        <p class={styles.note} style={{ marginTop: '10px' }}>
          {notes.join(' ')}
        </p>
      ) : null}
    </section>
  );
}

export function WordToPdfRightCards({ studio }: { studio: WordToPdfState }) {
  const { files, isProcessing } = studio;
  return (
    <div class={styles.column}>
      <SummarySection studio={studio} />
      <ResultPreviewSection studio={studio} />
      <PdfInfoSection studio={studio} />
      <RefPrivacy />
      <RefActions
        icon="file-output"
        label="Create PDF"
        busyLabel="Creating PDF…"
        busy={isProcessing}
        disabled={files.length === 0}
        onRun={() => void studio.executeWordToPdf()}
        downloadLabel="Download PDF"
        downloadDisabled={files.length === 0 || isProcessing}
        onDownload={() => void studio.downloadPdf()}
        onCopy={studio.copySummary}
        onReset={studio.clearAll}
      />
    </div>
  );
}
