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
          <span>📋</span> Compression Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}
        >
          ✓ Ready to compress
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{origMb} MB</span>
          <span class={styles.statLabel}>Original Size</span>
          <span class={styles.statSub}>{totalPages} pages</span>
        </div>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{compMb} MB</span>
          <span class={styles.statLabel}>Estimated Size</span>
          <span class={styles.statSub}>After compression</span>
        </div>
        <div class={styles.statTile}>
          <span class={styles.statVal}>{reductionPercent}%</span>
          <span class={styles.statLabel}>Size Reduction</span>
          <span class={styles.statSub}>Smaller size</span>
        </div>
        <div class={styles.statTile}>
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
          <span>📊</span> Before & After Comparison
        </h2>
      </div>
      <div class={styles.compareContainer}>
        <div>
          <div class={styles.compareRow}>
            <span>Original PDF</span>
            <span>{origMb} MB</span>
          </div>
          <div class={styles.barTrack}>
            <div class={styles.barFillOriginal} style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <div class={styles.compareRow}>
            <span>Compressed PDF (Estimated)</span>
            <span style={{ color: '#16a34a' }}>{compMb} MB</span>
          </div>
          <div class={styles.barTrack}>
            <div class={styles.barFillCompressed} style={{ width: `${compPercent}%` }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '6px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
            marginBottom: '4px',
          }}
        >
          <span>Preview (first 5 pages)</span>
          <span>{totalPages} pages total</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 2px' }}>
          {[1, 2, 3, 4, 5].map((p) => (
            <div
              key={p}
              style={{
                minWidth: '48px',
                height: '62px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '3px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ height: '3px', background: '#94a3b8', borderRadius: '1px' }} />
                <div
                  style={{
                    height: '2px',
                    background: '#e2e8f0',
                    borderRadius: '1px',
                    width: '80%',
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b' }}>{p}</span>
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
          onClick={() => void executeCompress()}
        >
          {isProcessing ? '⏳ Compressing PDF...' : '⚡ Compress PDF ➔'}
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
