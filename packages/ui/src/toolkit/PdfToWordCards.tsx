import styles from './pdfStudio.module.css';
import type { usePdfToWordStudio } from './usePdfConvertStudio.ts';

type PdfToWordState = ReturnType<typeof usePdfToWordStudio>;

function PdfToWordFileCard({ studio }: { studio: PdfToWordState }) {
  const { fileName, totalPages, fileSizeBytes, clearAll, loadSamplePdfToWord } = studio;
  const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.card} data-tour="pdf-upload">
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Upload PDF File
        </h2>
        <button
          type="button"
          onClick={loadSamplePdfToWord}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📄 Sample Contract
        </button>
      </div>
      {fileName ? (
        <div class={styles.fileRow} style={{ background: '#ffffff', borderColor: '#bfdbfe' }}>
          <div class={styles.fileIconBadge} style={{ backgroundColor: '#ef4444' }}>
            PDF
          </div>
          <div class={styles.fileDetails}>
            <span class={styles.fileName}>{fileName}</span>
            <span class={styles.fileMeta}>
              {totalPages} pages • {mb} MB
            </span>
          </div>
          <button
            type="button"
            class={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={clearAll}
            title="Clear file"
          >
            ✕
          </button>
        </div>
      ) : (
        <div class={styles.dropZone}>
          <span class={styles.dropIcon}>📄+</span>
          <p class={styles.dropMainText}>Drag & drop a PDF file here</p>
          <p class={styles.dropSubText}>or click to browse and select a file</p>
          <span class={styles.chooseBtn}>Choose PDF File</span>
        </div>
      )}
    </div>
  );
}

function PdfToWordOptionsCard({ studio }: { studio: PdfToWordState }) {
  const {
    enableOcr,
    setEnableOcr,
    keepHeadings,
    setKeepHeadings,
    preserveTables,
    setPreserveTables,
    language,
    setLanguage,
  } = studio;

  return (
    <div class={styles.card} data-tour="pdf-upload">
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Options
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="p2w-output-format">
            Output format
          </label>
          <input
            id="p2w-output-format"
            class={styles.textInput}
            value="DOCX (Word Document)"
            readOnly
          />
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>
              OCR for scanned PDFs
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Extract text from scanned PDFs and images
            </div>
          </div>
          <input
            type="checkbox"
            checked={enableOcr}
            onChange={(e) => setEnableOcr(e.currentTarget.checked)}
          />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={keepHeadings}
              onChange={(e) => setKeepHeadings(e.currentTarget.checked)}
            />
            <span>Keep original headings</span>
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={preserveTables}
              onChange={(e) => setPreserveTables(e.currentTarget.checked)}
            />
            <span>Preserve tables & layout</span>
          </label>
        </div>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="p2w-lang-select">
            Language (OCR)
          </label>
          <select
            id="p2w-lang-select"
            class={styles.textInput}
            value={language}
            onChange={(e) => setLanguage(e.currentTarget.value)}
          >
            <option value="English (Auto-detect)">English (Auto-detect)</option>
            <option value="Hindi / Bilingual">Hindi / Bilingual</option>
            <option value="European Languages">European Languages</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function PdfToWordLeftCards({ studio }: { studio: PdfToWordState }) {
  return (
    <div class={styles.scrollCol}>
      <PdfToWordFileCard studio={studio} />
      <PdfToWordOptionsCard studio={studio} />
    </div>
  );
}

function PdfToWordSummaryCard({ totalPages }: { totalPages: number }) {
  return (
    <div class={styles.card} data-tour="pdf-upload">
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
          <span style={{ fontSize: '13px' }}>📑</span>
          <span class={styles.statVal}>{totalPages}</span>
          <span class={styles.statLabel}>Input pages</span>
          <span class={styles.statSub}>From PDF file</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileGreen}`}>
          <span style={{ fontSize: '13px' }}>📊</span>
          <span class={styles.statVal}>~1.8 MB</span>
          <span class={styles.statLabel}>Estimated DOCX</span>
          <span class={styles.statSub}>After conversion</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileAmber}`}>
          <span style={{ fontSize: '13px' }}>⭐</span>
          <span class={styles.statVal}>High</span>
          <span class={styles.statLabel}>Detected text</span>
          <span class={styles.statSub}>Text-based PDF</span>
        </div>
        <div class={`${styles.statTile} ${styles.statTileBlue}`}>
          <span style={{ fontSize: '13px' }}>✓</span>
          <span class={styles.statVal}>Ready</span>
          <span class={styles.statLabel}>Conversion</span>
          <span class={styles.statSub}>All set</span>
        </div>
      </div>
    </div>
  );
}

export function PdfToWordRightCards({ studio }: { studio: PdfToWordState }) {
  const { totalPages, isProcessing, executeConvertToWord, downloadDocx, copySummary, clearAll } =
    studio;

  return (
    <div class={styles.scrollCol}>
      <PdfToWordSummaryCard totalPages={totalPages} />
      <div class={styles.card} data-tour="pdf-action">
        <div class={styles.cardHeader}>
          <h2 class={styles.cardTitle}>
            <span style={{ color: '#2563eb' }}>📝</span> Editable Output Preview
          </h2>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontWeight: 700,
            }}
          >
            ✏️ Editable in Word
          </span>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1e40af', fontWeight: 800 }}>
            Vendor Agreement
          </h3>
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '11.5px',
              color: '#334155',
              lineHeight: '1.4',
            }}
          >
            <strong>1. Agreement Overview:</strong> High-precision digital service delivery and
            enterprise SLA terms. Tables, columns, and styles preserved.
          </p>
        </div>
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
