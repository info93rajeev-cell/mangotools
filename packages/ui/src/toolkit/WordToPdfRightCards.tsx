import { RefActions, RefCardHead, RefPrivacy, RefStatus, RefTile } from './PdfRefParts.tsx';
import styles from './pdfRef.module.css';
import type { useWordToPdfStudio } from './useWordToPdfStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function statusOf(studio: WordToPdfState): { text: string; done: boolean } {
  if (studio.isProcessing) return { text: 'Creating…', done: false };
  if (studio.output) return { text: 'PDF created', done: true };
  if (studio.files.length > 0) return { text: 'Ready to convert', done: true };
  return { text: 'Add a .docx', done: false };
}

function SummarySection({ studio }: { studio: WordToPdfState }) {
  const { files, output, pageSize } = studio;
  const words = files.reduce((n, f) => n + f.words, 0);
  const pages = output
    ? output.reduce((n, o) => n + o.pages, 0)
    : files.reduce((n, f) => n + f.pages, 0);
  const size = output
    ? `${Math.max(1, Math.round(output.reduce((n, o) => n + o.bytes.length, 0) / 1024))} KB`
    : '—';
  const s = statusOf(studio);
  return (
    <section class={styles.card} aria-label="Export Summary">
      <RefCardHead
        icon="files"
        title="Export Summary"
        aside={<RefStatus text={s.text} done={s.done} />}
      />
      <div class={styles.tiles}>
        <RefTile
          tone="purple"
          icon="file-text"
          label="PDF pages"
          value={String(pages)}
          sub={`${pageSize} layout`}
        />
        <RefTile
          tone="green"
          icon="type"
          label="Words"
          value={String(words)}
          sub="From the .docx"
        />
        <RefTile tone="blue" icon="file-check" label="PDF size" value={size} sub="After creating" />
        <RefTile
          tone="amber"
          icon="files"
          label="Documents"
          value={String(files.length)}
          sub={studio.exportMode === 'single' ? 'Combined' : 'One PDF each'}
        />
      </div>
    </section>
  );
}

function CarryOverSection({ studio }: { studio: WordToPdfState }) {
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
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="What carries over">
      <RefCardHead icon="info" title="What carries over" />
      <p class={styles.note}>
        Text, headings, bold and italic, list bullets and line breaks.
        {notes.length > 0 ? ` ${notes.join(' ')}` : ''}
      </p>
    </section>
  );
}

export function WordToPdfRightCards({ studio }: { studio: WordToPdfState }) {
  const { files, isProcessing } = studio;
  return (
    <div class={styles.column}>
      <SummarySection studio={studio} />
      <CarryOverSection studio={studio} />
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
