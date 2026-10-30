import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './pdfStudio.module.css';
import type { CompressionPreset, usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressFileCard({ studio }: { studio: CompressStudioState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileName, fileSizeBytes, totalPages, handleAddNativeFile, clearAll } = studio;
  const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleAddNativeFile(file);
  }

  return (
    <div class={styles.card} data-tour="pdf-upload" style={{ padding: '8px 12px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Add PDF file
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={studio.loadSampleCompress}
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
            📄 Sample Dossier
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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
            {fileName ? 'Change File' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {!fileName ? (
        <button
          type="button"
          class={styles.dropZoneCompact}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span class={styles.dropIcon} style={{ fontSize: '22px' }}>
              🗜️+
            </span>
            <div>
              <p class={styles.dropMainText} style={{ fontSize: '13px' }}>
                Drag & drop a PDF file here
              </p>
              <p class={styles.dropSubText} style={{ fontSize: '11px' }}>
                or click to browse • 100% in-browser compression
              </p>
            </div>
          </div>
          <span class={styles.chooseBtn} style={{ padding: '6px 14px', fontSize: '12px' }}>
            Choose PDF File
          </span>
        </button>
      ) : (
        <div
          class={styles.fileRow}
          style={{ background: '#ffffff', borderColor: '#cbd5e1', marginTop: '4px' }}
        >
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
      )}
    </div>
  );
}

const PRESET_OPTIONS = [
  ['light', '🌱 Light Compression', 'Minimal quality loss', '~20–40% smaller'],
  ['balanced', '⚖️ Balanced (Recommended)', 'Best size and clarity', '~40–70% smaller'],
  ['strong', '📊 Strong Compression', 'Maximum size reduction', '~70–90% smaller'],
  ['custom', '⚙️ Custom', 'Fine-tune settings manually', 'Your own specs'],
] as const;

function PdfCompressOptionCheckboxes({ studio }: { studio: CompressStudioState }) {
  const {
    convertToGrayscale,
    setConvertToGrayscale,
    removeThumbnails,
    setRemoveThumbnails,
    linearize,
    setLinearize,
    preserveSearchableText,
    setPreserveSearchableText,
  } = studio;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={convertToGrayscale}
          onChange={(e) => setConvertToGrayscale(e.currentTarget.checked)}
        />
        <span>Convert to grayscale</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={removeThumbnails}
          onChange={(e) => setRemoveThumbnails(e.currentTarget.checked)}
        />
        <span>Remove thumbnails</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={linearize}
          onChange={(e) => setLinearize(e.currentTarget.checked)}
        />
        <span>Fast web view</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={preserveSearchableText}
          onChange={(e) => setPreserveSearchableText(e.currentTarget.checked)}
        />
        <span>Preserve text (OCR)</span>
      </label>
    </div>
  );
}

function PdfCompressAdvancedSettings({ studio }: { studio: CompressStudioState }) {
  const { imageQuality, setImageQuality, maxOutputSizeMb, setMaxOutputSizeMb } = studio;

  return (
    <details
      style={{
        background: '#f8fafc',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginTop: '6px',
      }}
    >
      <summary style={{ fontWeight: 700, fontSize: '11.5px', cursor: 'pointer', color: '#0f172a' }}>
        ⚙️ Advanced settings (optional)
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <label class={styles.inputLabel} for="compress-image-quality" style={{ fontSize: '11px' }}>
          Image quality: {imageQuality}%
        </label>
        <input
          id="compress-image-quality"
          type="range"
          min={10}
          max={100}
          value={imageQuality}
          onInput={(e) => setImageQuality(Number(e.currentTarget.value))}
          style={{ width: '100%', accentColor: '#2563eb' }}
        />
        <PdfCompressOptionCheckboxes studio={studio} />
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="compress-max-size" style={{ fontSize: '11px' }}>
            Maximum output target (MB)
          </label>
          <input
            id="compress-max-size"
            type="number"
            class={styles.textInput}
            value={maxOutputSizeMb}
            onInput={(e) => setMaxOutputSizeMb(Number(e.currentTarget.value) || 1)}
            min={1}
            max={100}
            style={{ padding: '5px 8px', fontSize: '12px' }}
          />
        </div>
      </div>
    </details>
  );
}

function PdfCompressSettingsCard({ studio }: { studio: CompressStudioState }) {
  const { preset, setPreset } = studio;

  return (
    <div class={styles.card} data-tour="pdf-arrange" style={{ padding: '8px 12px' }}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Compression settings
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
        {PRESET_OPTIONS.map(([p, title, desc, tag]) => {
          const isActive = preset === p;
          return (
            <button
              key={p}
              type="button"
              class={`${styles.radioCard} ${isActive ? styles.radioCardActive : ''}`}
              onClick={() => setPreset(p as CompressionPreset)}
              style={{ textAlign: 'left', padding: '6px 8px' }}
            >
              <span class={styles.radioTitle} style={{ fontSize: '11.5px' }}>
                <span style={{ color: isActive ? '#2563eb' : '#94a3b8' }}>
                  {isActive ? '●' : '○'}
                </span>
                {title}
              </span>
              <span class={styles.radioDesc} style={{ fontSize: '10px' }}>
                {desc}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: isActive ? '#1d4ed8' : '#2563eb',
                  marginTop: '2px',
                }}
              >
                {tag}
              </span>
            </button>
          );
        })}
      </div>

      <PdfCompressAdvancedSettings studio={studio} />
    </div>
  );
}

export function PdfCompressLeftCards({ studio }: { studio: CompressStudioState }) {
  return (
    <div class={styles.leftMergeCol}>
      <PdfCompressFileCard studio={studio} />
      <PdfCompressSettingsCard studio={studio} />
    </div>
  );
}
