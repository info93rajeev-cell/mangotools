import styles from './pdfStudio.module.css';
import type { usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressSummaryCard({
  origMb,
  compMb,
  totalPages,
  reductionPercent,
  qualityLevel,
}: {
  origMb: string;
  compMb: string;
  totalPages: number;
  reductionPercent: number;
  qualityLevel: string;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📋</span> Compression Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
        >
          ✓ Ready to compress
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={`${styles.statTile} ${styles.statTilePurple}`}>
          <span style={{ fontSize: '13px' }}>📑</span>
          <span class={styles.statVal}>{origMb} MB</span>
          <span class={styles.statLabel}>Original Size</span>
          <span class={styles.statSub}>{totalPages} pages</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span style={{ fontSize: '13px' }}>📄</span>
          <span class={styles.statVal}>{compMb} MB</span>
          <span class={styles.statLabel}>Estimated Size</span>
          <span class={styles.statSub}>After compression</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span style={{ fontSize: '13px' }}>📊</span>
          <span class={styles.statVal}>{reductionPercent}%</span>
          <span class={styles.statLabel}>Size Reduction</span>
          <span class={styles.statSub}>Smaller size</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span style={{ fontSize: '13px' }}>⭐</span>
          <span class={styles.statVal}>{qualityLevel}</span>
          <span class={styles.statLabel}>Quality Level</span>
          <span class={styles.statSub}>Clear & readable</span>
        </div>
      </div>
    </div>
  );
}

function PdfCompressComparisonCard({
  origMb,
  compMb,
  compPercent,
  totalPages,
}: {
  origMb: string;
  compMb: string;
  compPercent: number;
  totalPages: number;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📊</span> Before & After Comparison
        </h2>
      </div>
      <div class={styles.compareContainer}>
        <div>
          <div class={styles.compareRow}>
            <span>Original PDF</span>
            <span style={{ color: '#0f172a' }}>{origMb} MB</span>
          </div>
          <div class={styles.barTrack}>
            <div class={styles.barFillOriginal} style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <div class={styles.compareRow}>
            <span>Compressed PDF (Estimated)</span>
            <span style={{ color: '#16a34a', fontWeight: 800 }}>{compMb} MB</span>
          </div>
          <div class={styles.barTrack}>
            <div class={styles.barFillCompressed} style={{ width: `${compPercent}%` }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '6px',
            fontWeight: 600,
          }}
        >
          <span>Preview (first 5 pages)</span>
          <span>{totalPages} pages total</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 2px' }}>
          {[1, 2, 3, 4, 5].map((p) => (
            <div
              key={p}
              style={{
                minWidth: '54px',
                height: '70px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
                <div
                  style={{
                    height: '2px',
                    background: '#e2e8f0',
                    borderRadius: '1.5px',
                    width: '80%',
                  }}
                />
                <div
                  style={{
                    height: '2px',
                    background: '#e2e8f0',
                    borderRadius: '1.5px',
                    width: '60%',
                  }}
                />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#334155' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PdfCompressRightCards({ studio }: { studio: CompressStudioState }) {
  const {
    totalPages,
    estimate,
    isProcessing,
    executeCompress,
    downloadCompressed,
    copySummary,
    clearAll,
  } = studio;
  const origMb = (estimate.originalBytes / (1024 * 1024)).toFixed(1);
  const compMb = (estimate.compressedBytes / (1024 * 1024)).toFixed(1);
  const compPercent = Math.min(
    100,
    Math.round((estimate.compressedBytes / (estimate.originalBytes || 1)) * 100),
  );

  return (
    <div class={styles.scrollCol}>
      <PdfCompressSummaryCard
        origMb={origMb}
        compMb={compMb}
        totalPages={totalPages}
        reductionPercent={estimate.reductionPercent}
        qualityLevel={estimate.qualityLevel}
      />
      <PdfCompressComparisonCard
        origMb={origMb}
        compMb={compMb}
        compPercent={compPercent}
        totalPages={totalPages}
      />
      <div class={styles.card} data-tour="pdf-action">
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
          disabled={isProcessing || totalPages === 0}
          onClick={() => void executeCompress()}
        >
          {isProcessing ? '⏳ Compressing PDF...' : '🗜️ Compress PDF →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={downloadCompressed}
            disabled={totalPages === 0}
          >
            📥 Download Compressed PDF
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
