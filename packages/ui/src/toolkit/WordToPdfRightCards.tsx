import styles from './pdfStudio.module.css';
import type { useWordToPdfStudio } from './useWordToPdfStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

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

function WordToPdfSummaryCard({ studio }: { studio: WordToPdfState }) {
  const { files, output, pageSize, isProcessing } = studio;
  const words = files.reduce((n, f) => n + f.words, 0);
  const pages = output
    ? output.reduce((n, o) => n + o.pages, 0)
    : files.reduce((n, f) => n + f.pages, 0);
  const size = output
    ? `${Math.max(1, Math.round(output.reduce((n, o) => n + o.bytes.length, 0) / 1024))} KB`
    : '—';
  const label = isProcessing
    ? 'Creating…'
    : output
      ? '✓ PDF created'
      : files.length > 0
        ? 'Ready to convert'
        : 'Add a .docx';
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📋</span> Export Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{
            background: 'var(--color-tint-green)',
            color: 'var(--color-success)',
            borderColor: '#86efac',
          }}
        >
          {label}
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <Tile
          tone={styles.statTilePurple}
          icon="📑"
          value={String(pages)}
          label="PDF pages"
          sub={`${pageSize} layout`}
        />
        <Tile
          tone={styles.statTileGreen}
          icon="🔤"
          value={String(words)}
          label="Words"
          sub="From the .docx text"
        />
        <Tile
          tone={styles.statTileBlue}
          icon="📄"
          value={size}
          label="PDF size"
          sub="After creating"
        />
        <Tile
          tone={styles.statTileAmber}
          icon="📚"
          value={String(files.length)}
          label="Documents"
          sub={studio.exportMode === 'single' ? 'One combined PDF' : 'One PDF each'}
        />
      </div>
    </div>
  );
}

function WordToPdfNotesCard({ studio }: { studio: WordToPdfState }) {
  const images = studio.files.reduce((n, f) => n + f.content.images, 0);
  const tables = studio.files.reduce((n, f) => n + f.content.tables, 0);
  const replaced = studio.output?.reduce((n, o) => n + o.replacedChars, 0) ?? 0;
  const notes: string[] = [];
  if (images > 0) notes.push(`${images} image${images === 1 ? ' is' : 's are'} not included.`);
  if (tables > 0)
    notes.push(
      `${tables} table${tables === 1 ? '' : 's'}: each row is written as one line, cells separated by “|”.`,
    );
  if (replaced > 0)
    notes.push(
      `${replaced} character${replaced === 1 ? '' : 's'} outside Western European text show as “?”.`,
    );
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>ℹ️</span> What carries over
        </h2>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        Text, headings, bold and italic, list bullets and line breaks.
        {notes.length > 0 ? ` ${notes.join(' ')}` : ''}
      </p>
    </div>
  );
}

export function WordToPdfRightCards({ studio }: { studio: WordToPdfState }) {
  const { files, isProcessing, executeWordToPdf, downloadPdf, copySummary, clearAll } = studio;

  return (
    <div class={styles.leftMergeCol}>
      <WordToPdfSummaryCard studio={studio} />
      <WordToPdfNotesCard studio={studio} />
      <div class={styles.card} data-tour="pdf-action" style={{ padding: '8px 12px' }}>
        <div class={styles.privacyNotice} style={{ padding: '4px 8px', fontSize: '11px' }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — All conversion runs locally on your
            device.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || files.length === 0}
          onClick={() => void executeWordToPdf()}
        >
          {isProcessing ? '⏳ Creating PDF...' : '📄 Create PDF →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={() => void downloadPdf()}
            disabled={files.length === 0 || isProcessing}
          >
            📥 Download PDF
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
