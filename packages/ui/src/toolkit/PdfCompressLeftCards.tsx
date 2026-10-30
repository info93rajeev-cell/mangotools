import type { JSX } from 'preact';
import styles from './pdfStudio.module.css';
import type { CompressionPreset, usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressFileCard({ studio }: { studio: CompressStudioState }) {
  const { fileName, fileSizeBytes, totalPages, handleAddNativeFile, clearAll } = studio;
  const mb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  function onFileInputChange(e: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = e.currentTarget.files?.[0];
    if (file) void handleAddNativeFile(file);
  }

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>1</span> Add PDF file
        </h2>
        <label style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
          Browse New File
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
          />
        </label>
      </div>

      {fileName ? (
        <div class={styles.fileRow} style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
          <div class={styles.fileIconBadge} style={{ backgroundColor: '#7c3aed' }}>
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
          <span class={styles.dropIcon}>🗜️+</span>
          <p class={styles.dropMainText}>Drag & drop a PDF file here, or click to browse</p>
          <span class={styles.chooseBtn}>Choose PDF File</span>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
          />
        </label>
      )}
    </div>
  );
}

const PRESET_OPTIONS = [
  [
    'light',
    '🌱 Light Compression',
    'Slightly reduce size, minimal quality loss',
    '~20–40% smaller',
  ],
  [
    'balanced',
    '⚖️ Balanced (Recommended)',
    'Good balance of file size and visual quality',
    '~40–70% smaller',
  ],
  [
    'strong',
    '📊 Strong Compression',
    'Maximum size reduction with lower quality',
    '~70–90% smaller',
  ],
  ['custom', '⚙️ Custom', 'Fine-tune compression manually', 'Your own settings'],
] as const;

function PdfCompressAdvancedSettings({ studio }: { studio: CompressStudioState }) {
  const {
    imageQuality,
    setImageQuality,
    convertToGrayscale,
    setConvertToGrayscale,
    removeThumbnails,
    setRemoveThumbnails,
    linearize,
    setLinearize,
    preserveSearchableText,
    setPreserveSearchableText,
    maxOutputSizeMb,
    setMaxOutputSizeMb,
  } = studio;

  return (
    <details
      style={{
        background: '#f8fafc',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}
      open
    >
      <summary style={{ fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: '#1e293b' }}>
        ⚙️ Advanced settings (optional)
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <label class={styles.inputLabel} for="compress-image-quality">
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
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={convertToGrayscale}
              onChange={(e) => setConvertToGrayscale(e.currentTarget.checked)}
            />
            <span>Convert to grayscale</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={removeThumbnails}
              onChange={(e) => setRemoveThumbnails(e.currentTarget.checked)}
            />
            <span>Remove thumbnails</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={linearize}
              onChange={(e) => setLinearize(e.currentTarget.checked)}
            />
            <span>Fast web view</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preserveSearchableText}
              onChange={(e) => setPreserveSearchableText(e.currentTarget.checked)}
            />
            <span>Preserve text (OCR)</span>
          </label>
        </div>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="compress-max-size">
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
          />
        </div>
      </div>
    </details>
  );
}

function PdfCompressSettingsCard({ studio }: { studio: CompressStudioState }) {
  const { preset, setPreset } = studio;

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <span class={styles.stepNum}>2</span> Compression settings
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {PRESET_OPTIONS.map(([p, title, desc, tag]) => (
          <button
            key={p}
            type="button"
            class={`${styles.radioCard} ${preset === p ? styles.radioCardActive : ''}`}
            onClick={() => setPreset(p as CompressionPreset)}
            style={{ textAlign: 'left' }}
          >
            <span class={styles.radioTitle}>
              <input type="radio" checked={preset === p} readOnly />
              {title}
            </span>
            <span class={styles.radioDesc}>{desc}</span>
            <span
              style={{ fontSize: '10.5px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}
            >
              {tag}
            </span>
          </button>
        ))}
      </div>

      <PdfCompressAdvancedSettings studio={studio} />
    </div>
  );
}

export function PdfCompressLeftCards({ studio }: { studio: CompressStudioState }) {
  return (
    <div class={styles.scrollCol}>
      <PdfCompressFileCard studio={studio} />
      <PdfCompressSettingsCard studio={studio} />
    </div>
  );
}
