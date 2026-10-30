import styles from './pdfStudio.module.css';
import type { SplitPartInfo, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

const PART_COLORS = ['#fef2f2', '#eff6ff', '#f0fdf4', '#faf5ff', '#fffbeb'];
const PART_BORDER = ['#fca5a5', '#93c5fd', '#86efac', '#d8b4fe', '#fde68a'];
const PART_TEXT = ['#b91c1c', '#1d4ed8', '#15803d', '#7e22ce', '#b45309'];

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
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span>📋</span> Split Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}
        >
          ✓ Ready to split
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{totalPages}</span>
          <span class={styles.statLabel}>Total pages</span>
          <span class={styles.statSub}>Input file</span>
        </div>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{partCount}</span>
          <span class={styles.statLabel}>Split files</span>
          <span class={styles.statSub}>Will be created</span>
        </div>
        <div class={styles.statTile}>
          <span class={styles.statVal}>~{totalMb} MB</span>
          <span class={styles.statLabel}>Est. output size</span>
          <span class={styles.statSub}>After split</span>
        </div>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{downloadAsZip ? 'ZIP Ready' : 'Separate'}</span>
          <span class={styles.statLabel}>Download format</span>
          <span class={styles.statSub}>{downloadAsZip ? 'All in one' : 'Individual'}</span>
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
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span>👁️</span> Output Preview
        </h2>
        <span class={styles.headerCounter}>
          {parts.length} files • {totalPages} pages total
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {parts.slice(0, 4).map((part, idx) => (
          <div
            key={part.name}
            style={{
              background: PART_COLORS[idx % PART_COLORS.length],
              border: `1px solid ${PART_BORDER[idx % PART_BORDER.length]}`,
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: PART_TEXT[idx % PART_TEXT.length],
                }}
              >
                Pages {part.startPage} – {part.endPage}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{part.pageCount} p</span>
            </div>
            <div
              style={{
                height: '32px',
                background: '#fff',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                padding: '3px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{ height: '3px', background: '#cbd5e1', width: '80%', borderRadius: '2px' }}
              />
              <div
                style={{ height: '2px', background: '#e2e8f0', width: '60%', borderRadius: '2px' }}
              />
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#334155',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
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
  const totalMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.scrollCol}>
      <PdfSplitSummaryCard
        totalPages={totalPages}
        partCount={parts.length}
        totalMb={totalMb}
        downloadAsZip={downloadAsZip}
      />
      <PdfSplitPreviewGrid parts={parts} totalPages={totalPages} />
      <div class={styles.card}>
        <div class={styles.privacyNotice}>
          <span>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — All processing is done locally on
            your device.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || totalPages === 0}
          onClick={() => void executeSplit()}
        >
          {isProcessing ? '⏳ Splitting PDF...' : '✂️ Split PDF ➔'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={downloadResult}
            disabled={totalPages === 0}
          >
            📥 {downloadAsZip ? 'Download ZIP' : 'Download Part 1'}
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
