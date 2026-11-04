import { pagesLabel } from './pdfSplitPlan.ts';
import styles from './pdfStudio.module.css';
import type { SplitPartInfo, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

const PART_COLORS = ['#fef2f2', '#eff6ff', '#f0fdf4', '#faf5ff'];
const PART_BORDER = ['#fca5a5', '#93c5fd', '#86efac', '#d8b4fe'];
const PART_TEXT = ['#dc2626', '#2563eb', '#16a34a', '#9333ea'];

function PdfSplitSummaryCard({
  totalPages,
  partCount,
  totalMb,
  downloadAsZip,
}: {
  totalPages: number;
  partCount: number;
  totalMb: string;
  downloadAsZip: boolean;
}) {
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📋</span> Split Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{
            background: 'var(--color-tint-green)',
            color: 'var(--color-success)',
            borderColor: '#86efac',
          }}
        >
          {partCount === 0 ? 'Nothing to split' : '✓ Ready to split'}
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={`${styles.statTile} ${styles.statTilePurple}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📑
          </span>
          <span class={styles.statVal}>{totalPages}</span>
          <span class={styles.statLabel}>Total pages</span>
          <span class={styles.statSub}>Input file</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📄
          </span>
          <span class={styles.statVal}>{partCount}</span>
          <span class={styles.statLabel}>Split files</span>
          <span class={styles.statSub}>Will be created</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📊
          </span>
          <span class={styles.statVal}>~{totalMb} MB</span>
          <span class={styles.statLabel}>Est. output size</span>
          <span class={styles.statSub}>Pages × average size</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📦
          </span>
          <span class={styles.statVal}>{partCount > 1 && downloadAsZip ? 'ZIP' : 'PDF'}</span>
          <span class={styles.statLabel}>Download format</span>
          <span class={styles.statSub}>
            {partCount > 1 ? (downloadAsZip ? 'All in one ZIP' : 'Separate PDFs') : 'One PDF'}
          </span>
        </div>
      </div>
    </div>
  );
}

function PdfSplitPreviewGrid({
  parts,
  totalPages,
}: {
  parts: SplitPartInfo[];
  totalPages: number;
}) {
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>👁️</span> Output Preview
        </h2>
        <span class={styles.headerCounter}>
          {parts.length} files • {totalPages} pages total
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '6px',
        }}
      >
        {parts.slice(0, 4).map((part, idx) => (
          <div
            key={part.name}
            style={{
              background: PART_COLORS[idx % PART_COLORS.length],
              border: `1px solid ${PART_BORDER[idx % PART_BORDER.length]}`,
              borderRadius: '7px',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: PART_TEXT[idx % PART_TEXT.length],
                }}
              >
                Pages {pagesLabel(part.pages)}
              </span>
              <span
                style={{ fontSize: '10px', color: 'var(--color-text-subtle)', fontWeight: 600 }}
              >
                {part.pageCount} {part.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </div>
            <div
              style={{
                height: '24px',
                background: 'var(--color-panel)',
                borderRadius: '4px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                padding: '0 6px',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: '3px',
                  background: 'var(--color-track)',
                  borderRadius: '1.5px',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={part.name}
            >
              {part.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PdfSplitRightCards({ studio }: { studio: SplitStudioState }) {
  const {
    totalPages,
    parts,
    fileSizeBytes,
    isProcessing,
    downloadAsZip,
    executeSplit,
    downloadResult,
    copySummary,
    clearAll,
  } = studio;
  const estimate = parts.reduce((n, p) => n + p.sizeBytes, 0) || fileSizeBytes;
  const totalMb = (estimate / (1024 * 1024)).toFixed(1);
  const downloadLabel =
    parts.length <= 1
      ? 'Download PDF'
      : downloadAsZip
        ? 'Download ZIP'
        : `Download ${parts.length} PDFs`;

  return (
    <div class={styles.leftMergeCol}>
      <PdfSplitSummaryCard
        totalPages={totalPages}
        partCount={parts.length}
        totalMb={totalMb}
        downloadAsZip={downloadAsZip}
      />
      <PdfSplitPreviewGrid parts={parts} totalPages={totalPages} />
      <div class={styles.card} data-tour="pdf-action" style={{ padding: '8px 12px' }}>
        <div class={styles.privacyNotice} style={{ padding: '4px 8px', fontSize: '11px' }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — 100% private client-side processing.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || totalPages === 0 || parts.length === 0}
          onClick={() => void executeSplit()}
        >
          {isProcessing ? '⏳ Splitting PDF...' : '✂️ Split PDF →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={() => void downloadResult()}
            disabled={totalPages === 0 || parts.length === 0 || isProcessing}
          >
            📥 {downloadLabel}
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
