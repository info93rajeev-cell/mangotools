import type { JSX } from 'preact';
import styles from './pdfStudio.module.css';
import type { SplitMode, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

function HeavyBookBanner({ totalPages }: { totalPages: number }) {
  if (totalPages < 1500) return null;
  return (
    <div
      style={{
        background: '#f0f9ff',
        border: '1px solid #7dd3fc',
        borderRadius: '8px',
        padding: '8px 10px',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px' }}>📚</span>
        <strong style={{ fontSize: '12px', color: '#0369a1' }}>
          Heavy Book Engine (1,600 Pages Active)
        </strong>
      </div>
      <p style={{ fontSize: '11px', color: '#0c4a6e', margin: 0, lineHeight: 1.35 }}>
        Split into 16 chapters (100 pages each) locally. No Adobe sign-in, upload limits, or tab
        freezing.
      </p>
    </div>
  );
}

function PdfMiniThumbnails() {
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 2px' }}>
      {[1, 2, 3, 4, 5].map((pg) => (
        <div
          key={pg}
          style={{
            minWidth: '58px',
            height: '76px',
            border: pg === 1 ? '2px solid #2563eb' : '1px solid #cbd5e1',
            borderRadius: '6px',
            background: '#fff',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div
              style={{
                height: '4px',
                background: pg === 1 ? '#bfdbfe' : '#e2e8f0',
                borderRadius: '2px',
              }}
            />
            <div
              style={{ height: '3px', background: '#e2e8f0', borderRadius: '2px', width: '85%' }}
            />
          </div>
          <span
            style={{ fontSize: '10px', fontWeight: 700, color: pg === 1 ? '#2563eb' : '#64748b' }}
          >
            {pg}
          </span>
        </div>
      ))}
    </div>
  );
}

function PdfSplitFileCard({ studio }: { studio: SplitStudioState }) {
  const { fileName, totalPages, fileSizeBytes, clearAll, handleAddNativeFile } = studio;
  const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleAddNativeFile(file);
  }

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> PDF File
        </h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={studio.splitHeavyBookIntoChapters}
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #7dd3fc',
              background: '#f0f9ff',
              color: '#0369a1',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📚 1,600-Page Book
          </button>
          <label style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
            Change File
            <input
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={onFileInputChange}
            />
          </label>
        </div>
      </div>

      <HeavyBookBanner totalPages={totalPages} />

      {fileName ? (
        <div class={styles.fileRow} style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
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
        <label class={styles.dropZone}>
          <span class={styles.dropIcon}>📄+</span>
          <p class={styles.dropMainText}>Choose a PDF to Split</p>
          <span class={styles.chooseBtn}>Browse PDF</span>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
          />
        </label>
      )}

      <PdfMiniThumbnails />
    </div>
  );
}

const SPLIT_MODES = [
  ['ranges', '📄 Page ranges', 'Split by custom ranges'],
  ['extract', '📑 Extract pages', 'Pick specific pages'],
  ['every', '📚 Every page', 'Split single pages'],
  ['chunks', '📦 Fixed chunks', 'Split by group size'],
] as const;

function ModeInputs({ studio }: { studio: SplitStudioState }) {
  const {
    mode,
    ranges,
    extractInput,
    setExtractInput,
    chunkSize,
    setChunkSize,
    totalPages,
    addRange,
    removeRange,
  } = studio;

  if (mode === 'ranges') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#475569',
          }}
        >
          <span>Page ranges (e.g. 1-10, 11-20)</span>
          <span>{ranges.length} ranges selected</span>
        </div>
        <div class={styles.rangeChipsRow}>
          {ranges.map((r) => (
            <span key={r.id} class={styles.rangeChip}>
              {r.start} – {r.end}
              <button type="button" class={styles.chipCloseBtn} onClick={() => removeRange(r.id)}>
                ×
              </button>
            </span>
          ))}
          <button type="button" class={styles.addChipBtn} onClick={addRange}>
            + Add range
          </button>
        </div>
      </div>
    );
  }
  if (mode === 'extract') {
    return (
      <div class={styles.inputRow}>
        <label class={styles.inputLabel} for="split-extract-pages">
          Specific pages to extract
        </label>
        <input
          id="split-extract-pages"
          class={styles.textInput}
          value={extractInput}
          onInput={(e) => setExtractInput(e.currentTarget.value)}
          placeholder="e.g. 1, 3, 5-10"
        />
      </div>
    );
  }
  if (mode === 'chunks') {
    return (
      <div class={styles.inputRow}>
        <label class={styles.inputLabel} for="split-chunk-size">
          Pages per split file
        </label>
        <input
          id="split-chunk-size"
          type="number"
          class={styles.textInput}
          value={chunkSize}
          onInput={(e) => setChunkSize(Number(e.currentTarget.value) || 1)}
          min={1}
          max={totalPages || 100}
        />
      </div>
    );
  }
  return (
    <p
      style={{
        fontSize: '12px',
        color: '#475569',
        margin: 0,
        background: '#f8fafc',
        padding: '8px',
        borderRadius: '6px',
      }}
    >
      Extracts all {totalPages} pages into individual separate single-page PDF files.
    </p>
  );
}

function PdfSplitModesCard({ studio }: { studio: SplitStudioState }) {
  const { mode, setMode } = studio;

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Split Configuration
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {SPLIT_MODES.map(([m, label, sub]) => (
          <button
            key={m}
            type="button"
            class={`${styles.radioCard} ${mode === m ? styles.radioCardActive : ''}`}
            onClick={() => setMode(m as SplitMode)}
            style={{ textAlign: 'left', padding: '6px 8px' }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: mode === m ? '#1d4ed8' : '#1e293b',
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: '9.5px', color: '#64748b' }}>{sub}</span>
          </button>
        ))}
      </div>

      <ModeInputs studio={studio} />
    </div>
  );
}

function PdfSplitOptionsCard({ studio }: { studio: SplitStudioState }) {
  const {
    keepBookmarks,
    setKeepBookmarks,
    separateFiles,
    setSeparateFiles,
    compressOutput,
    setCompressOutput,
    pattern,
    setPattern,
    downloadAsZip,
    setDownloadAsZip,
  } = studio;

  return (
    <div class={styles.card}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={keepBookmarks}
            onChange={(e) => setKeepBookmarks(e.currentTarget.checked)}
          />
          <span>Keep bookmarks (if available)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={separateFiles}
            onChange={(e) => setSeparateFiles(e.currentTarget.checked)}
          />
          <span>Create a separate file for each range</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={compressOutput}
            onChange={(e) => setCompressOutput(e.currentTarget.checked)}
          />
          <span>Compress output files (smaller size)</span>
        </label>
      </div>

      <div class={styles.inputRow}>
        <label class={styles.inputLabel} for="split-file-pattern">
          Output file name pattern
        </label>
        <input
          id="split-file-pattern"
          class={styles.textInput}
          value={pattern}
          onInput={(e) => setPattern(e.currentTarget.value)}
          placeholder="Audit-Report-2025_Part_{n}"
        />
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={downloadAsZip}
          onChange={(e) => setDownloadAsZip(e.currentTarget.checked)}
        />
        <span>Download all files as a ZIP archive</span>
      </label>
    </div>
  );
}

export function PdfSplitLeftCards({ studio }: { studio: SplitStudioState }) {
  return (
    <div class={styles.scrollCol}>
      <PdfSplitFileCard studio={studio} />
      <PdfSplitModesCard studio={studio} />
      <PdfSplitOptionsCard studio={studio} />
    </div>
  );
}
