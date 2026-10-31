import styles from './pdfStudio.module.css';
import type { useWordToPdfStudio } from './usePdfConvertStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function WordToPdfSummaryCard({
  totalPages,
  totalMb,
  pageSize,
}: {
  totalPages: number;
  totalMb: string;
  pageSize: string;
}) {
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📋</span> Export Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
        >
          ✓ Ready to convert
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={`${styles.statTile} ${styles.statTilePurple}`}>
          <span style={{ fontSize: '12px' }}>📑</span>
          <span class={styles.statVal}>{totalPages}</span>
          <span class={styles.statLabel}>Total pages</span>
          <span class={styles.statSub}>DOCX source</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span style={{ fontSize: '12px' }}>📊</span>
          <span class={styles.statVal}>~{totalMb} MB</span>
          <span class={styles.statLabel}>Estimated size</span>
          <span class={styles.statSub}>After conversion</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span style={{ fontSize: '12px' }}>📄</span>
          <span class={styles.statVal}>{pageSize}</span>
          <span class={styles.statLabel}>Page size</span>
          <span class={styles.statSub}>Standard format</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span style={{ fontSize: '12px' }}>⭐</span>
          <span class={styles.statVal}>Ready</span>
          <span class={styles.statLabel}>Settings</span>
          <span class={styles.statSub}>Configured</span>
        </div>
      </div>
    </div>
  );
}

function WordToPdfPreviewCard({ studio }: { studio: WordToPdfState }) {
  const { files, pageSize, margins } = studio;
  const firstTitle = files[0]?.name.replace(/\.[^/.]+$/, '') || 'Document';

  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>👁️</span> Result Preview (Sample)
        </h2>
        <span class={styles.headerCounter}>PDF Layout Quality</span>
      </div>
      <div class={styles.pdfInfoGrid}>
        <div class={styles.pdfInfoItem}>
          <span class={styles.pdfInfoLabel}>Output Document:</span>
          <span class={styles.pdfInfoValue}>{firstTitle}.pdf</span>
        </div>
        <div class={styles.pdfInfoItem}>
          <span class={styles.pdfInfoLabel}>Format Standard:</span>
          <span class={styles.pdfInfoValue}>PDF 1.7 / ISO 32000</span>
        </div>
        <div class={styles.pdfInfoItem}>
          <span class={styles.pdfInfoLabel}>Page & Margins:</span>
          <span class={styles.pdfInfoValue}>
            {pageSize} • {margins} Margins
          </span>
        </div>
        <div class={styles.pdfInfoItem}>
          <span class={styles.pdfInfoLabel}>Font & Assets:</span>
          <span class={styles.pdfInfoValue}>Embedded Vector Fonts</span>
        </div>
      </div>
    </div>
  );
}

export function WordToPdfRightCards({ studio }: { studio: WordToPdfState }) {
  const { files, pageSize, isProcessing, executeWordToPdf, downloadPdf, copySummary, clearAll } =
    studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);
  const totalMb = (files.reduce((acc, f) => acc + f.sizeBytes, 0) / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.leftMergeCol}>
      <WordToPdfSummaryCard totalPages={totalPages} totalMb={totalMb} pageSize={pageSize} />
      <WordToPdfPreviewCard studio={studio} />
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
            onClick={downloadPdf}
            disabled={files.length === 0}
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
