import styles from './pdfStudio.module.css';
import type { usePdfMergeStudio } from './usePdfMergeStudio.ts';

type MergeStudioState = ReturnType<typeof usePdfMergeStudio>;

function PdfMergeSummaryCard({
  fileCount,
  totalPageCount,
  totalMb,
  hasBookmarks,
}: {
  fileCount: number;
  totalPageCount: number;
  totalMb: string;
  hasBookmarks: boolean;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📋</span> Merge Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
        >
          ✓ Ready to merge
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span style={{ fontSize: '13px' }}>📄</span>
          <span class={styles.statVal}>{fileCount}</span>
          <span class={styles.statLabel}>PDF files</span>
          <span class={styles.statSub}>Selected</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTilePurple}`}>
          <span style={{ fontSize: '13px' }}>📑</span>
          <span class={styles.statVal}>{totalPageCount}</span>
          <span class={styles.statLabel}>Total pages</span>
          <span class={styles.statSub}>Across all files</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span style={{ fontSize: '13px' }}>📊</span>
          <span class={styles.statVal}>{totalMb} MB</span>
          <span class={styles.statLabel}>Estimated size</span>
          <span class={styles.statSub}>After merge</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span style={{ fontSize: '13px' }}>🔖</span>
          <span class={styles.statVal}>{hasBookmarks ? 'Yes' : 'No'}</span>
          <span class={styles.statLabel}>Bookmarks</span>
          <span class={styles.statSub}>File names</span>
        </div>
      </div>
    </div>
  );
}

function resolveFlowBadgeClass(idx: number): string {
  if (idx % 4 === 0) return styles.flowBadgeRed;
  if (idx % 4 === 1) return styles.flowBadgeBlue;
  if (idx % 4 === 2) return styles.flowBadgeGreen;
  return styles.flowBadgePurple;
}

function PdfMergePreviewFlowCard({
  ranges,
  totalPageCount,
}: {
  ranges: { name: string; start: number; end: number }[];
  totalPageCount: number;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>👁️</span> Merged Document Preview
        </h2>
        <span class={styles.headerCounter}>Total pages: {totalPageCount}</span>
      </div>
      <div class={styles.flowTimeline}>
        {ranges.map((r, i) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div class={styles.flowCard}>
              <span class={styles.flowCardTitle} title={r.name}>
                {r.name.replace(/\.pdf$/i, '')}
              </span>
              <div class={styles.flowThumbMock}>
                <div class={styles.flowMockLine} style={{ width: '85%' }} />
                <div class={styles.flowMockLine} style={{ width: '65%' }} />
                <div class={styles.flowMockLine} style={{ width: '75%', opacity: 0.7 }} />
              </div>
              <span class={resolveFlowBadgeClass(i)}>
                {r.start} – {r.end}
              </span>
            </div>
            {i < ranges.length - 1 && <span class={styles.flowPlus}>+</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PdfMergeRightCards({ studio }: { studio: MergeStudioState }) {
  const { files, summary, isProcessing, executeMerge, downloadMerged, copySummary, clearAll } =
    studio;
  const totalMb = (summary.totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.scrollCol}>
      <PdfMergeSummaryCard
        fileCount={summary.fileCount}
        totalPageCount={summary.totalPageCount}
        totalMb={totalMb}
        hasBookmarks={summary.hasBookmarks}
      />
      <PdfMergePreviewFlowCard ranges={summary.ranges} totalPageCount={summary.totalPageCount} />
      <div class={styles.card}>
        <div class={styles.privacyNotice}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — All processing is done locally on
            your device. We do not upload, store or share your files.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || files.length === 0}
          onClick={() => void executeMerge()}
        >
          {isProcessing ? '⏳ Merging PDFs...' : '📄 Merge PDFs →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={downloadMerged}
            disabled={files.length === 0}
          >
            📥 Download Merged PDF
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
