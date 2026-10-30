import type { JSX } from 'preact';
import { HeavyBookBanner, PdfMiniThumbnails } from './PdfSplitThumbnails.tsx';
import styles from './pdfStudio.module.css';
import type { SplitMode, usePdfSplitStudio } from './usePdfSplitStudio.ts';

type SplitStudioState = ReturnType<typeof usePdfSplitStudio>;

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={studio.splitHeavyBookIntoChapters}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
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
        <div class={styles.fileRow} style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <span>Page ranges (e.g. 1-12, 13-42)</span>
          <span>
            {ranges.length} ranges • {totalPages} pages selected
          </span>
        </div>
        <div class={styles.rangeChipsRow}>
          {ranges.map((r) => (
            <span key={r.id} class={styles.rangeChip}>
              {r.start} – {r.end}
              <button type="button" class={styles.chipCloseBtn} onClick={() => removeRange(r.id)}>
                ✕
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
        color: '#334155',
        margin: 0,
        background: '#f8fafc',
        padding: '10px 12px',
        borderRadius: '7px',
        border: '1px solid #e2e8f0',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {SPLIT_MODES.map(([m, label, sub]) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              type="button"
              class={`${styles.radioCard} ${isActive ? styles.radioCardActive : ''}`}
              onClick={() => setMode(m as SplitMode)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                background: isActive ? '#2563eb' : '#ffffff',
                borderColor: isActive ? '#1d4ed8' : '#e2e8f0',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isActive ? '#ffffff' : '#0f172a',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: isActive ? '#dbeafe' : '#64748b',
                  fontWeight: 500,
                }}
              >
                {sub}
              </span>
            </button>
          );
        })}
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={keepBookmarks}
            onChange={(e) => setKeepBookmarks(e.currentTarget.checked)}
          />
          <span>Keep bookmarks</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={separateFiles}
            onChange={(e) => setSeparateFiles(e.currentTarget.checked)}
          />
          <span>Separate files</span>
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
          gap: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
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
