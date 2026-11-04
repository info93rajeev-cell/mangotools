import { reductionPercent } from './pdfCompressor.ts';
import styles from './pdfStudio.module.css';
import type { usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressSummaryCard({
  origMb,
  compMb,
  totalPages,
  reduction,
  imagesNote,
  status,
}: {
  origMb: string;
  compMb: string;
  totalPages: number;
  reduction: string;
  imagesNote: string;
  status: string;
}) {
  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📋</span> Compression Summary
        </h2>
        <span
          class={styles.badgePill}
          style={{
            background: 'var(--color-tint-green)',
            color: 'var(--color-success)',
            borderColor: '#86efac',
          }}
        >
          {status}
        </span>
      </div>
      <div class={styles.statTilesGrid}>
        <div class={`${styles.statTile} ${styles.statTilePurple}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📑
          </span>
          <span class={styles.statVal}>{origMb} MB</span>
          <span class={styles.statLabel}>Original Size</span>
          <span class={styles.statSub}>{totalPages} pages</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📄
          </span>
          <span class={styles.statVal}>{compMb}</span>
          <span class={styles.statLabel}>Compressed Size</span>
          <span class={styles.statSub}>Measured result</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span class={styles.statIcon} aria-hidden="true">
            📊
          </span>
          <span class={styles.statVal}>{reduction}</span>
          <span class={styles.statLabel}>Size Reduction</span>
          <span class={styles.statSub}>Smaller size</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span class={styles.statIcon} aria-hidden="true">
            ⭐
          </span>
          <span class={styles.statVal}>{imagesNote}</span>
          <span class={styles.statLabel}>Images re-encoded</span>
          <span class={styles.statSub}>JPEG images only</span>
        </div>
      </div>
    </div>
  );
}

function ResultNote({ studio }: { studio: CompressStudioState }) {
  const r = studio.result;
  if (!r) return null;
  let text = `${r.imagesRecompressed} of ${r.imagesFound} JPEG images were re-encoded; text, fonts and vector graphics are unchanged.`;
  if (r.imagesFound === 0)
    text = 'No JPEG images were found, so only the file structure was compacted.';
  if (r.noGain)
    text += ' The compressed copy was not smaller, so the download is your original file.';
  if (!r.targetMet && r.targetBytes)
    text += ` The ${(r.targetBytes / (1024 * 1024)).toFixed(1)} MB target was not reached after ${r.attempts} passes.`;
  return (
    <div
      class={styles.privacyNotice}
      role="status"
      style={{ padding: '6px 10px', fontSize: '11px' }}
    >
      <span>{text}</span>
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
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: 'var(--color-primary)' }}>📊</span> Before & After Comparison
        </h2>
      </div>
      <div class={styles.compareContainer}>
        <div>
          <div class={styles.compareRow}>
            <span>Original PDF</span>
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{origMb} MB</span>
          </div>
          <div class={styles.barTrack}>
            <div class={styles.barFillOriginal} style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <div class={styles.compareRow}>
            <span>Compressed PDF</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>{compMb}</span>
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
            color: 'var(--color-text-subtle)',
            marginBottom: '4px',
            fontWeight: 600,
          }}
        >
          <span>Pages</span>
          <span>{totalPages} pages total</span>
        </div>
        <div class={styles.thumbStrip}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
            <div key={p} class={styles.thumbItemBtn} style={{ cursor: 'default' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ height: '3px', background: '#94a3b8', borderRadius: '1.5px' }} />
                <div
                  style={{
                    height: '2px',
                    background: 'var(--color-track)',
                    borderRadius: '1.5px',
                    width: '80%',
                  }}
                />
                <div
                  style={{
                    height: '2px',
                    background: 'var(--color-track)',
                    borderRadius: '1.5px',
                    width: '60%',
                  }}
                />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)' }}>
                Page {p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function figures(studio: CompressStudioState) {
  const { result, fileSizeBytes, isProcessing } = studio;
  const mb = (b: number) => `${(b / (1024 * 1024)).toFixed(2)} MB`;
  if (!result) {
    return {
      origMb: (fileSizeBytes / (1024 * 1024)).toFixed(2),
      compMb: '—',
      compPercent: 0,
      reduction: '—',
      imagesNote: '—',
      status: isProcessing ? 'Compressing…' : fileSizeBytes > 0 ? 'Ready to compress' : 'Add a PDF',
    };
  }
  return {
    origMb: (result.originalBytes / (1024 * 1024)).toFixed(2),
    compMb: mb(result.compressedBytes),
    compPercent: Math.round((result.compressedBytes / result.originalBytes) * 100),
    reduction: `${reductionPercent(result.originalBytes, result.compressedBytes)}%`,
    imagesNote: `${result.imagesRecompressed} / ${result.imagesFound}`,
    status: result.noGain ? 'Already compact' : '✓ Compressed',
  };
}

export function PdfCompressRightCards({ studio }: { studio: CompressStudioState }) {
  const { totalPages, isProcessing, executeCompress, downloadCompressed, copySummary, clearAll } =
    studio;
  const f = figures(studio);

  return (
    <div class={styles.leftMergeCol}>
      <PdfCompressSummaryCard
        origMb={f.origMb}
        compMb={f.compMb}
        totalPages={totalPages}
        reduction={f.reduction}
        imagesNote={f.imagesNote}
        status={f.status}
      />
      <PdfCompressComparisonCard
        origMb={f.origMb}
        compMb={f.compMb}
        compPercent={f.compPercent}
        totalPages={totalPages}
      />
      {studio.result ? <ResultNote studio={studio} /> : null}
      <div class={styles.card} data-tour="pdf-action" style={{ padding: '8px 12px' }}>
        <div class={styles.privacyNotice} style={{ padding: '4px 8px', fontSize: '11px' }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — 100% private client-side compression.
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
            onClick={() => void downloadCompressed()}
            disabled={totalPages === 0 || isProcessing}
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
