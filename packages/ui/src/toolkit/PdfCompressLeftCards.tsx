import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { fileMeta } from './pdfFileMeta.ts';
import styles from './pdfStudio.module.css';
import type { CompressionPreset, usePdfCompressStudio } from './usePdfCompressStudio.ts';

type CompressStudioState = ReturnType<typeof usePdfCompressStudio>;

function PdfCompressFileCard({ studio }: { studio: CompressStudioState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileName, fileSizeBytes, totalPages, handleAddNativeFile, clearAll } = studio;

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
              background: 'var(--color-tint-blue)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📄 Sample PDF
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              background: 'var(--color-tint-blue)',
              color: 'var(--color-primary)',
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
          style={{ background: 'var(--color-panel)', borderColor: '#cbd5e1', marginTop: '4px' }}
        >
          <div class={styles.fileIconBadge} style={{ backgroundColor: '#ef4444' }}>
            PDF
          </div>
          <div class={styles.fileDetails}>
            <span class={styles.fileName}>{fileName}</span>
            <span class={styles.fileMeta}>{fileMeta(totalPages, fileSizeBytes)}</span>
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
  ['light', '🌱 Light Compression', 'Minimal quality loss', 'JPEG 82%, up to 3000 px'],
  ['balanced', '⚖️ Balanced (Recommended)', 'Best size and clarity', 'JPEG 70%, up to 2000 px'],
  ['strong', '📊 Strong Compression', 'Maximum size reduction', 'JPEG 50%, up to 1400 px'],
  ['custom', '⚙️ Custom', 'Choose the image quality', 'Your quality, up to 2000 px'],
] as const;

function OptionCheck(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

function PdfCompressOptionCheckboxes({ studio }: { studio: CompressStudioState }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 12px',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      <OptionCheck
        label="Convert images to grayscale"
        checked={studio.convertToGrayscale}
        onChange={studio.setConvertToGrayscale}
      />
      <OptionCheck
        label="Remove page thumbnails"
        checked={studio.removeThumbnails}
        onChange={studio.setRemoveThumbnails}
      />
      <OptionCheck
        label="Aim for a maximum size"
        checked={studio.useSizeTarget}
        onChange={studio.setUseSizeTarget}
      />
    </div>
  );
}

function PdfCompressAdvancedSettings({ studio }: { studio: CompressStudioState }) {
  const { imageQuality, setImageQuality, maxOutputSizeMb, setMaxOutputSizeMb } = studio;

  return (
    <details
      style={{
        background: 'var(--color-panel-subtle)',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginTop: '6px',
      }}
    >
      <summary
        style={{
          fontWeight: 700,
          fontSize: '11.5px',
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        ⚙️ Advanced settings (optional)
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <label class={styles.inputLabel} for="compress-image-quality" style={{ fontSize: '11px' }}>
          Image quality (Custom): {imageQuality}%
        </label>
        <input
          id="compress-image-quality"
          type="range"
          min={10}
          max={100}
          value={imageQuality}
          onInput={(e) => {
            setImageQuality(Number(e.currentTarget.value));
            studio.setPreset('custom');
          }}
          style={{ width: '100%', accentColor: '#2563eb' }}
        />
        <PdfCompressOptionCheckboxes studio={studio} />
        <p
          style={{
            margin: 0,
            fontSize: '10.5px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.45,
          }}
        >
          JPEG images are re-encoded in your browser; text, fonts and vector graphics are never
          changed, so text stays searchable. Other image types are kept as they are.
        </p>
        <div class={styles.inputRow}>
          <label class={styles.inputLabel} for="compress-max-size" style={{ fontSize: '11px' }}>
            Maximum size (MB)
          </label>
          <input
            id="compress-max-size"
            type="number"
            class={styles.textInput}
            value={maxOutputSizeMb}
            onInput={(e) => setMaxOutputSizeMb(Number(e.currentTarget.value) || 1)}
            disabled={!studio.useSizeTarget}
            min={0.1}
            step={0.1}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '6px',
        }}
      >
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
                <span
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-subtle)' }}
                >
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
                  color: 'var(--color-primary)',
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
