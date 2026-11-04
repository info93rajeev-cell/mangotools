import styles from './pdfStudio.module.css';
import { fs } from './phoneFontSize.ts';
import type { usePdfToWordStudio } from './usePdfToWordStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function Tile(props: { tone: string; icon: string; value: string; label: string; sub: string }) {
  return (
    <div class={`${styles.statTile} ${props.tone}`}>
      <span class={styles.statIcon} aria-hidden="true">
        {props.icon}
      </span>
      <span class={styles.statVal}>{props.value}</span>
      <span class={styles.statLabel}>{props.label}</span>
      <span class={styles.statSub}>{props.sub}</span>
    </div>
  );
}

function status(studio: PdfToWordState): string {
  const ex = studio.extraction;
  if (studio.isProcessing) return 'Reading…';
  if (!ex) return 'Add a PDF';
  if (ex.words === 0) return 'No text found';
  return studio.docx ? '✓ Converted' : 'Ready to convert';
}

function PdfToWordSummaryCard({ studio }: { studio: PdfToWordState }) {
  const ex = studio.extraction;
  const docxKb = studio.docx ? `${Math.max(1, Math.round(studio.docx.length / 1024))} KB` : '—';
  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📋</span> Conversion Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{
            background: 'var(--color-tint-green)',
            color: 'var(--color-success)',
            borderColor: '#86efac',
          }}
        >
          {status(studio)}
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <Tile
          tone={styles.statTilePurple}
          icon="📑"
          value={String(ex?.pages.length ?? 0)}
          label="Input pages"
          sub={`${ex?.pagesWithText ?? 0} with text`}
        />
        <Tile
          tone={styles.statTileGreen}
          icon="🔤"
          value={String(ex?.words ?? 0)}
          label="Words found"
          sub="Selectable text"
        />
        <Tile
          tone={styles.statTileAmber}
          icon="🔖"
          value={String(ex?.headings ?? 0)}
          label="Headings"
          sub="From larger text"
        />
        <Tile
          tone={styles.statTileBlue}
          icon="📄"
          value={docxKb}
          label="DOCX size"
          sub="After conversion"
        />
      </div>
    </div>
  );
}

function PreviewBody({ studio }: { studio: PdfToWordState }) {
  const ex = studio.extraction;
  if (!ex)
    return (
      <p
        style={{
          fontSize: fs(11),
          color: 'var(--color-text-muted)',
          margin: 0,
        }}
      >
        Add a PDF to see its text here.
      </p>
    );
  if (ex.words === 0) {
    return (
      <p
        style={{
          fontSize: fs(11),
          color: '#b45309',
          margin: 0,
        }}
      >
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
    <div
      style={{
        maxHeight: '190px',
        overflow: 'auto',
        fontSize: fs(11.5),
        lineHeight: 1.5,
        color: 'var(--color-text)',
      }}
    >
      {shown.slice(0, 60).map((b, i) => (
        <p
          key={String(i)}
          style={{
            margin: '0 0 6px',
            fontWeight: b.kind === 'p' ? 400 : 700,
            paddingLeft: studio.previewTab === 'outline' && b.kind === 'h2' ? '12px' : 0,
          }}
        >
          {b.text}
        </p>
      ))}
      {shown.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No headings found.</p>
      ) : null}
    </div>
  );
}

function PdfToWordPreviewCard({ studio }: { studio: PdfToWordState }) {
  const tab = (id: 'text' | 'outline', label: string) => (
    <button
      type="button"
      aria-pressed={studio.previewTab === id}
      class={`${styles.previewTabBtn} ${studio.previewTab === id ? styles.previewTabBtnActive : ''}`}
      onClick={() => studio.setPreviewTab(id)}
    >
      {label}
    </button>
  );
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📝</span> Text Preview
        </h2>
        <div class={styles.previewTabs}>
          {tab('text', 'Text')}
          {tab('outline', 'Outline')}
        </div>
      </div>
      <PreviewBody studio={studio} />
    </div>
  );
}

export function PdfToWordRightCards({ studio }: { studio: PdfToWordState }) {
  const { totalPages, isProcessing, executeConvertToWord, downloadDocx, copySummary, clearAll } =
    studio;

  return (
    <div class={styles.leftMergeCol}>
      <PdfToWordSummaryCard studio={studio} />
      <PdfToWordPreviewCard studio={studio} />
      <div class={styles.card} data-tour="pdf-action" style={{ padding: '8px 12px' }}>
        <div class={styles.privacyNotice} style={{ padding: '4px 8px', fontSize: fs(11) }}>
          <span style={{ fontSize: fs(14) }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — 100% private client-side conversion.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || totalPages === 0 || studio.extraction?.words === 0}
          onClick={() => void executeConvertToWord()}
        >
          {isProcessing ? '⏳ Converting to Word...' : '📄 Convert to Word →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={downloadDocx}
            disabled={totalPages === 0 || studio.extraction?.words === 0}
          >
            📥 Download DOCX
          </button>
          <button type="button" class={styles.actionBtnNeutral} onClick={copySummary}>
            📋 Copy Summary
          </button>
          <button type="button" class={styles.actionBtnNeutral} onClick={clearAll}>
            ↻ Reset
          </button>
        </div>
      </div>
    </div>
  );
}
