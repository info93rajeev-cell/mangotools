import type { JSX } from 'preact';
import styles from './pdfStudio.module.css';
import type { useWordToPdfStudio } from './usePdfConvertStudio.ts';

type WordToPdfState = ReturnType<typeof useWordToPdfStudio>;

function WordToPdfFileListCard({ studio }: { studio: WordToPdfState }) {
  const { files, loadSampleWordDocs, handleAddNativeFiles } = studio;
  const totalPages = files.reduce((acc, f) => acc + f.pages, 0);

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const list = e.currentTarget.files;
    if (list && list.length > 0) void handleAddNativeFiles(list);
  }

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
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
            onClick={loadSampleWordDocs}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
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

      <label class={styles.dropZoneCompact}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span class={styles.dropIcon} style={{ fontSize: '22px' }}>
            📘+
          </span>
          <div>
            <p class={styles.dropMainText} style={{ fontSize: '13px' }}>
              Drag & drop Word files (.docx, .doc)
            </p>
            <p class={styles.dropSubText} style={{ fontSize: '11px' }}>
              or click to browse multiple files • 100% in-browser
            </p>
          </div>
        </div>
        <span class={styles.chooseBtn} style={{ padding: '6px 14px', fontSize: '12px' }}>
          Choose Word Files
        </span>
        <input
          type="file"
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          multiple
          style={{ display: 'none' }}
          onChange={onFileInputChange}
        />
      </label>

      {files.length > 0 && (
        <div class={styles.fileList} style={{ maxHeight: '110px', marginTop: '6px' }}>
          {files.map((f) => (
            <div
              key={f.id}
              class={styles.fileRow}
              style={{ background: '#ffffff', borderColor: '#bfdbfe', padding: '6px 10px' }}
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
      )}
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
    <div class={styles.card} style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Conversion Settings
        </h2>
      </div>
      <div class={styles.settingsGrid}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div class={styles.radioCard} style={{ padding: '6px 10px' }}>
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              Page size
            </span>
            <select
              class={styles.textInput}
              value={pageSize}
              onChange={(e) => setPageSize(e.currentTarget.value as 'A4' | 'Letter')}
              style={{ padding: '5px 8px', fontSize: '11.5px' }}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
            </select>
          </div>
          <div class={styles.radioCard} style={{ padding: '6px 10px' }}>
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              Margins
            </span>
            <select
              class={styles.textInput}
              value={margins}
              onChange={(e) => setMargins(e.currentTarget.value as 'Standard' | 'Compact')}
              style={{ padding: '5px 8px', fontSize: '11.5px' }}
            >
              <option value="Standard">Standard (Normal)</option>
              <option value="Compact">Compact (Reduced)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'single' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('single')}
            style={{ flex: 1, textAlign: 'left', padding: '6px 10px' }}
          >
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              <span>{exportMode === 'single' ? '●' : '○'}</span> Single merged PDF
            </span>
            <span class={styles.radioDesc} style={{ fontSize: '10px' }}>
              Combine all Word files
            </span>
          </button>
          <button
            type="button"
            class={`${styles.radioCard} ${exportMode === 'separate' ? styles.radioCardActive : ''}`}
            onClick={() => setExportMode('separate')}
            style={{ flex: 1, textAlign: 'left', padding: '6px 10px' }}
          >
            <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
              <span>{exportMode === 'separate' ? '●' : '○'}</span> One PDF per file
            </span>
            <span class={styles.radioDesc} style={{ fontSize: '10px' }}>
              Keep files separate
            </span>
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => setIncludeBookmarks(e.currentTarget.checked)}
            />
            <span>Include bookmarks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preserveLinks}
              onChange={(e) => setPreserveLinks(e.currentTarget.checked)}
            />
            <span>Preserve hyperlinks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
    <div class={styles.leftMergeCol}>
      <WordToPdfFileListCard studio={studio} />
      <WordToPdfSettingsCard studio={studio} />
    </div>
  );
}

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
