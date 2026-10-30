import styles from './pdfStudio.module.css';
import type { useWordToPdfStudio } from './usePdfConvertStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function WordToPdfFileListCard({ studio }: { studio: WordToPdfState }) {
  const { files } = studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Add Word files
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span class={styles.headerCounter}>
            {files.length} files • {totalPages} pages
          </span>
          <button
            type="button"
            onClick={studio.loadSampleWordDocs}
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
            📘 Sample DOCX
          </button>
        </div>
      </div>
      <div class={styles.fileList}>
        {files.map((f) => (
          <div
            key={f.id}
            class={styles.fileRow}
            style={{ background: '#ffffff', borderColor: '#bfdbfe' }}
          >
            <div class={styles.fileIconBadge} style={{ backgroundColor: '#2563eb' }}>
              DOC
            </div>
            <div class={styles.fileDetails}>
              <span class={styles.fileName}>{f.name}</span>
              <span class={styles.fileMeta}>
                {f.pages} pages • {(f.sizeBytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordToPdfSettingsCard({ studio }: { studio: WordToPdfState }) {
  const {
    pageSize,
    setPageSize,
    margins,
    setMargins,
    exportMode,
    setExportMode,
    preserveLinks,
    setPreserveLinks,
    includeBookmarks,
    setIncludeBookmarks,
    compressOutput,
    setCompressOutput,
  } = studio;

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Settings
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div class={styles.radioCard}>
            <span class={styles.radioTitle}>Page size</span>
            <select
              class={styles.textInput}
              value={pageSize}
              onChange={(e) => setPageSize(e.currentTarget.value as 'A4' | 'Letter')}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
            </select>
          </div>
          <div class={styles.radioCard}>
            <span class={styles.radioTitle}>Margins</span>
            <select
              class={styles.textInput}
              value={margins}
              onChange={(e) => setMargins(e.currentTarget.value as 'Standard' | 'Compact')}
            >
              <option value="Standard">Standard (Normal)</option>
              <option value="Compact">Compact (Reduced)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'single' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('single')}
            style={{ flex: 1, textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>
              <span>{exportMode === 'single' ? '●' : '○'}</span> Single merged PDF
            </span>
            <span class={styles.radioDesc}>Combine all Word files</span>
          </button>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'separate' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('separate')}
            style={{ flex: 1, textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>
              <span>{exportMode === 'separate' ? '●' : '○'}</span> One PDF per file
            </span>
            <span class={styles.radioDesc}>Keep files separate</span>
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '12.5px',
            fontWeight: 600,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => setIncludeBookmarks(e.currentTarget.checked)}
            />
            <span>Include bookmarks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preserveLinks}
              onChange={(e) => setPreserveLinks(e.currentTarget.checked)}
            />
            <span>Preserve hyperlinks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compressOutput}
              onChange={(e) => setCompressOutput(e.currentTarget.checked)}
            />
            <span>Compress output</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function WordToPdfLeftCards({ studio }: { studio: WordToPdfState }) {
  return (
    <div class={styles.scrollCol}>
      <WordToPdfFileListCard studio={studio} />
      <WordToPdfSettingsCard studio={studio} />
    </div>
  );
}

export function WordToPdfRightCards({ studio }: { studio: WordToPdfState }) {
  const { files, pageSize, isProcessing, executeWordToPdf, downloadPdf, copySummary, clearAll } =
    studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);
  const totalMb = (files.reduce((acc, f) => acc + f.sizeBytes, 0) / (1024 * 1024)).toFixed(1);

  return (
    <div class={styles.scrollCol}>
      <div class={styles.card}>
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
            <span style={{ fontSize: '13px' }}>📑</span>
            <span class={styles.statVal}>{totalPages}</span>
            <span class={styles.statLabel}>Total pages</span>
            <span class={styles.statSub}>Across {files.length} files</span>
          </div>
          <div class={`${styles.statTile} ${styles.statTileGreen}`}>
            <span style={{ fontSize: '13px' }}>📊</span>
            <span class={styles.statVal}>~{totalMb} MB</span>
            <span class={styles.statLabel}>Estimated size</span>
            <span class={styles.statSub}>After conversion</span>
          </div>
          <div class={`${styles.statTile} ${styles.statTileBlue}`}>
            <span style={{ fontSize: '13px' }}>📄</span>
            <span class={styles.statVal}>{pageSize}</span>
            <span class={styles.statLabel}>Page size</span>
            <span class={styles.statSub}>Standard format</span>
          </div>
          <div class={`${styles.statTile} ${styles.statTileAmber}`}>
            <span style={{ fontSize: '13px' }}>⭐</span>
            <span class={styles.statVal}>Ready</span>
            <span class={styles.statLabel}>Settings</span>
            <span class={styles.statSub}>Configured</span>
          </div>
        </div>
      </div>
      <div class={styles.card}>
        <div class={styles.privacyNotice}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <span>
            <strong>Your files stay in your browser</strong> — All conversion runs locally on your
            device. We do not upload, store or share your files.
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
