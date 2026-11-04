import { RefActions, RefCardHead, RefPrivacy, RefStatus, RefTile } from './PdfRefParts.tsx';
import styles from './pdfRef.module.css';
import type { usePdfToWordStudio } from './usePdfToWordStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function status(studio: PdfToWordState): { text: string; done: boolean } {
  const ex = studio.extraction;
  if (studio.isProcessing) return { text: 'Reading…', done: false };
  if (!ex) return { text: 'Add a PDF', done: false };
  if (ex.words === 0) return { text: 'No text found', done: false };
  return { text: studio.docx ? 'Converted' : 'Ready to convert', done: true };
}

function SummarySection({ studio }: { studio: PdfToWordState }) {
  const ex = studio.extraction;
  const docxKb = studio.docx ? `${Math.max(1, Math.round(studio.docx.length / 1024))} KB` : '—';
  const s = status(studio);
  return (
    <section class={styles.card} aria-label="Conversion Summary">
      <RefCardHead
        icon="files"
        title="Conversion Summary"
        aside={<RefStatus text={s.text} done={s.done} />}
      />
      <div class={styles.tiles}>
        <RefTile
          tone="purple"
          icon="file-text"
          label="Input pages"
          value={String(ex?.pages.length ?? 0)}
          sub={`${ex?.pagesWithText ?? 0} with text`}
        />
        <RefTile
          tone="green"
          icon="type"
          label="Words found"
          value={String(ex?.words ?? 0)}
          sub="Selectable text"
        />
        <RefTile
          tone="amber"
          icon="list"
          label="Headings"
          value={String(ex?.headings ?? 0)}
          sub="From larger text"
        />
        <RefTile
          tone="blue"
          icon="file-check"
          label="DOCX size"
          value={docxKb}
          sub="After conversion"
        />
      </div>
    </section>
  );
}

function PreviewBody({ studio }: { studio: PdfToWordState }) {
  const ex = studio.extraction;
  if (!ex) return <p class={styles.previewEmpty}>Add a PDF to see its text here.</p>;
  if (ex.words === 0) {
    return (
      <p class={styles.previewEmpty}>
        No selectable text was found. This is usually a scanned PDF (a picture of text), which needs
        OCR; this tool does not do OCR.
      </p>
    );
  }
  const blocks = ex.blocks.flatMap((b) => (b.kind === 'page' ? [] : [b]));
  const shown =
    studio.previewTab === 'outline'
      ? blocks.filter((b) => b.kind === 'h1' || b.kind === 'h2')
      : blocks;
  return (
    <div class={styles.docPreview}>
      {shown.slice(0, 60).map((b, i) => (
        <p
          // biome-ignore lint/suspicious/noArrayIndexKey: preview blocks have no id
          key={i}
          class={b.kind === 'h1' ? styles.docH1 : b.kind === 'h2' ? styles.docH2 : styles.docP}
        >
          {b.text}
        </p>
      ))}
      {shown.length === 0 ? <p class={styles.previewEmpty}>No headings were detected.</p> : null}
    </div>
  );
}

function PreviewSection({ studio }: { studio: PdfToWordState }) {
  const tab = (id: 'text' | 'outline', label: string) => (
    <button
      type="button"
      aria-pressed={studio.previewTab === id}
      class={`${styles.segBtn} ${studio.previewTab === id ? styles.segBtnActive : ''}`}
      onClick={() => studio.setPreviewTab(id)}
    >
      {label}
    </button>
  );
  return (
    <section class={`${styles.card} ${styles.subcard}`} aria-label="Editable Output Preview">
      <RefCardHead
        icon="file-text"
        title="Editable Output Preview"
        aside={
          <span class={styles.seg}>
            {tab('text', 'Text View')}
            {tab('outline', 'Outline')}
          </span>
        }
      />
      <PreviewBody studio={studio} />
    </section>
  );
}

export function PdfToWordRightCards({ studio }: { studio: PdfToWordState }) {
  const noText = studio.extraction?.words === 0;
  return (
    <div class={styles.column}>
      <SummarySection studio={studio} />
      <PreviewSection studio={studio} />
      <RefPrivacy />
      <RefActions
        icon="file-text"
        label="Convert to Word"
        busyLabel="Converting to Word…"
        busy={studio.isProcessing}
        disabled={studio.totalPages === 0 || noText}
        onRun={() => void studio.executeConvertToWord()}
        downloadLabel="Download DOCX"
        downloadDisabled={studio.totalPages === 0 || noText}
        onDownload={studio.downloadDocx}
        onCopy={studio.copySummary}
        onReset={studio.clearAll}
      />
    </div>
  );
}
