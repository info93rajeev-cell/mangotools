import styles from './jpgToPdfStudio.module.css';
import type { PageSizeOption, PdfImageItem } from './usePdfStudioState.ts';

function resolveChipClass(index: number): string {
  const chips = [
    styles.chipBlue,
    styles.chipPurple,
    styles.chipGreen,
    styles.chipAmber,
    styles.chipPink,
  ];
  return chips[index % chips.length] ?? styles.chipBlue;
}

export function JpgToPdfSummaryCard({
  images,
  pageSize,
  orientation,
  outputFileName,
}: {
  images: PdfImageItem[];
  pageSize: PageSizeOption;
  orientation: string;
  outputFileName: string;
}) {
  const totalBytes = images.reduce((acc, img) => acc + img.size, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.card} data-tour="summary">
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📄</span> PDF Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
        >
          ✓ Ready to convert
        </span>
      </div>

      <div class={styles.summaryGrid}>
        <div class={`${styles.summaryTile} ${styles.tileBlue}`}>
          <span class={styles.tileIcon}>🖼️</span>
          <span class={styles.tileVal}>{images.length}</span>
          <span class={styles.tileLabel}>Images</span>
          <span class={styles.tileSub}>Selected</span>
        </div>

        <div class={`${styles.summaryTile} ${styles.tilePurple}`}>
          <span class={styles.tileIcon}>📑</span>
          <span class={styles.tileVal}>{images.length}</span>
          <span class={styles.tileLabel}>PDF pages</span>
          <span class={styles.tileSub}>Will be created</span>
        </div>

        <div class={`${styles.summaryTile} ${styles.tileGreen}`}>
          <span class={styles.tileIcon}>💾</span>
          <span class={styles.tileVal}>{totalMb} MB</span>
          <span class={styles.tileLabel}>Estimated size</span>
          <span class={styles.tileSub}>After conversion</span>
        </div>

        <div class={`${styles.summaryTile} ${styles.tileAmber}`}>
          <span class={styles.tileIcon}>🔖</span>
          <span class={styles.tileVal}>{pageSize.toUpperCase()}</span>
          <span class={styles.tileLabel}>Page size</span>
          <span class={styles.tileSub}>
            {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
          </span>
        </div>
      </div>

      {/* Semantic test hooks for e2e compatibility */}
      <div style={{ display: 'none' }} data-primary-result="">
        <output>{images.length}</output>
      </div>
      <dl style={{ display: 'none' }} data-output="fileName">
        <dt>File</dt>
        <dd>{outputFileName}</dd>
      </dl>
    </div>
  );
}

export function JpgToPdfPreviewCard({ images }: { images: PdfImageItem[] }) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>👁️</span> PDF Preview ({images.length}{' '}
          {images.length === 1 ? 'page' : 'pages'})
        </h2>
        <span class={styles.headerPill}>Total pages: {images.length}</span>
      </div>

      {images.length === 0 ? (
        <div
          style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}
        >
          Upload images to view live page preview sheets.
        </div>
      ) : (
        <div class={styles.previewCarousel}>
          {images.map((item, index) => (
            <div key={item.id} class={styles.previewSheetCard}>
              <div class={styles.paperSheet}>
                <img
                  src={item.blobUrl}
                  alt={`Page ${index + 1}`}
                  class={styles.paperSheetImg}
                  style={{ transform: `rotate(${item.rotation ?? 0}deg)` }}
                />
              </div>
              <span class={styles.sheetName} title={item.name}>
                {item.name.replace(/\.[^/.]+$/, '')}
              </span>
              <span class={`${styles.pageChip} ${resolveChipClass(index)}`}>Page {index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function JpgToPdfActionCard({
  imagesCount,
  isCompiling,
  onDownload,
  onCopySummary,
  onReset,
}: {
  imagesCount: number;
  isCompiling: boolean;
  onDownload: () => void;
  onCopySummary: () => void;
  onReset: () => void;
}) {
  return (
    <div class={styles.card} data-tour="action">
      <div class={styles.privacyBox}>
        <span style={{ fontSize: '16px' }}>🔒</span>
        <span>
          <strong class={styles.privacyTextBold}>Your files stay in your browser</strong> — All
          processing is done locally on your device. We do not upload, store or share your files.
        </span>
      </div>

      <button
        type="button"
        class={styles.primaryCtaBtn}
        disabled={imagesCount === 0 || isCompiling}
        onClick={onDownload}
      >
        <span>📄</span>
        <span>{isCompiling ? 'Compiling PDF...' : 'Create PDF →'}</span>
      </button>

      <div class={styles.secondaryRow}>
        <button
          type="button"
          class={`${styles.secBtn} ${styles.secBtnPrimary}`}
          onClick={onDownload}
          disabled={imagesCount === 0 || isCompiling}
        >
          📥 Download PDF
        </button>
        <button type="button" class={styles.secBtn} onClick={onCopySummary}>
          📋 Copy Summary
        </button>
        <button type="button" class={styles.secBtn} onClick={onReset}>
          ↻ Reset
        </button>
      </div>

      <div class={styles.accordionRow}>
        <a href="#disclaimer" class={styles.accordionPill}>
          ℹ Disclaimer +
        </a>
        <a href="#how-to-use" class={styles.accordionPill}>
          📖 How to use +
        </a>
        <a href="#method" class={styles.accordionPill}>
          ⚙ Method +
        </a>
        <a href="#faq" class={styles.accordionPill}>
          ❓ FAQ +
        </a>
        <a href="#related" class={styles.accordionPill}>
          🔗 Related tools +
        </a>
      </div>
    </div>
  );
}
