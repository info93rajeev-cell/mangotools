import styles from './pdfStudio.module.css';
import type { usePdfToWordStudio } from './usePdfConvertStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfToWordSummaryCard({ totalPages }: { totalPages: number }) {
  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📋</span> Conversion Summary
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
          <span class={styles.statLabel}>Input pages</span>
          <span class={styles.statSub}>From PDF file</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span style={{ fontSize: '12px' }}>📊</span>
          <span class={styles.statVal}>~1.8 MB</span>
          <span class={styles.statLabel}>Estimated DOCX</span>
          <span class={styles.statSub}>After conversion</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span style={{ fontSize: '12px' }}>⭐</span>
          <span class={styles.statVal}>High</span>
          <span class={styles.statLabel}>Detected text</span>
          <span class={styles.statSub}>Text-based PDF</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span style={{ fontSize: '12px' }}>✓</span>
          <span class={styles.statVal}>Ready</span>
          <span class={styles.statLabel}>Conversion</span>
          <span class={styles.statSub}>All set</span>
        </div>
      </div>
    </div>
  );
}

function PdfToWordPreviewCard({ studio }: { studio: PdfToWordState }) {
  const { previewTab, setPreviewTab, fileName } = studio;
  const docTitle = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Vendor Agreement';

  return (
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span style={{ color: '#2563eb' }}>📝</span> Editable Output Preview
        </h2>
        <div class={styles.previewTabs}>
          <button
            type="button"
            class={`${styles.previewTabBtn} ${previewTab === 'visual' ? styles.previewTabBtnActive : ''}`}
            onClick={() => setPreviewTab('visual')}
          >
            Visual Preview
          </button>
          <button
            type="button"
            class={`${styles.previewTabBtn} ${previewTab === 'text' ? styles.previewTabBtnActive : ''}`}
            onClick={() => setPreviewTab('text')}
          >
            Text View
          </button>
          <button
            type="button"
            class={`${styles.previewTabBtn} ${previewTab === 'outline' ? styles.previewTabBtnActive : ''}`}
            onClick={() => setPreviewTab('outline')}
          >
            Outline
          </button>
        </div>
      </div>

      <div class={styles.sideBySidePreview}>
        <div class={styles.docPreviewMock}>
          <div class={styles.docPreviewMockTitle}>
            <span style={{ color: '#ef4444' }}>📄</span>
            <span>[PDF] {docTitle}</span>
          </div>
          <div
            style={{ height: '3px', background: '#cbd5e1', borderRadius: '1.5px', width: '90%' }}
          />
          <div
            style={{ height: '3px', background: '#e2e8f0', borderRadius: '1.5px', width: '70%' }}
          />
          <div
            style={{ height: '3px', background: '#e2e8f0', borderRadius: '1.5px', width: '85%' }}
          />
          <span style={{ fontSize: '10px', color: '#64748b' }}>Original layout & tables</span>
        </div>
        <span class={styles.sideArrow}>→</span>
        <div
          class={styles.docPreviewMock}
          style={{ borderColor: '#93c5fd', background: '#f8fafc' }}
        >
          <div class={styles.docPreviewMockTitle}>
            <span style={{ color: '#2563eb' }}>📝</span>
            <span style={{ color: '#1d4ed8' }}>[Word] {docTitle}</span>
          </div>
          <div
            style={{ height: '3px', background: '#93c5fd', borderRadius: '1.5px', width: '90%' }}
          />
          <div
            style={{ height: '3px', background: '#bfdbfe', borderRadius: '1.5px', width: '70%' }}
          />
          <div
            style={{ height: '3px', background: '#bfdbfe', borderRadius: '1.5px', width: '85%' }}
          />
          <span style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 600 }}>
            Editable paragraphs & styles
          </span>
        </div>
      </div>
    </div>
  );
}

export function PdfToWordRightCards({ studio }: { studio: PdfToWordState }) {
  const { totalPages, isProcessing, executeConvertToWord, downloadDocx, copySummary, clearAll } =
    studio;

  return (
    <div class={styles.leftMergeCol}>
      <PdfToWordSummaryCard totalPages={totalPages} />
      <PdfToWordPreviewCard studio={studio} />
      <div class={styles.card} data-tour="pdf-action" style={{ padding: '8px 12px' }}>
        <div class={styles.privacyNotice} style={{ padding: '4px 8px', fontSize: '11px' }}>
          <span style={{ fontSize: '14px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — 100% private client-side conversion.
          </span>
        </div>
        <button
          type="button"
          class={styles.primaryCtaBtn}
          disabled={isProcessing || totalPages === 0}
          onClick={() => void executeConvertToWord()}
        >
          {isProcessing ? '⏳ Converting to Word...' : '📄 Convert to Word →'}
        </button>
        <div class={styles.secondaryActionRow}>
          <button
            type="button"
            class={styles.actionBtnPrimaryBlue}
            onClick={downloadDocx}
            disabled={totalPages === 0}
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
