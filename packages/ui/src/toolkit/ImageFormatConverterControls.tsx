import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import styles from './imageFormatConverter.module.css';
import type {
  TargetImageFormat,
  UseImageFormatConverterReturn,
} from './useImageFormatConverter.ts';

export interface ImageFormatConverterControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  converter: UseImageFormatConverterReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const FORMAT_OPTIONS: { id: TargetImageFormat; name: string; desc: string }[] = [
  { id: 'jpg', name: 'JPG', desc: 'Photo' },
  { id: 'png', name: 'PNG', desc: 'Lossless' },
  { id: 'webp', name: 'WebP', desc: 'Small' },
];

function UploadSection({
  idPrefix,
  preset,
  converter,
  onSelectFile,
  onTrySample,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  converter: UseImageFormatConverterReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = converter.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>1. Upload Image</span>
        <Button variant="ghost" icon="sparkle" onClick={onTrySample} disabled={isExecuting}>
          Try Sample
        </Button>
      </div>

      <input
        id={fileInputId}
        type="file"
        accept={preset.ui.fileAccept ?? 'image/jpeg,image/png,image/webp'}
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) onSelectFile(f);
        }}
      />

      {!converter.file ? (
        <div class={styles.uploadRow}>
          <label for={fileInputId} class={styles.uploadMainBtn}>
            📁 Upload Image
          </label>
        </div>
      ) : (
        <div class={styles.activeFileWrapper}>
          <div class={styles.activeFileBadge}>
            <span class={styles.activeFileName} title={converter.file?.name}>
              {converter.file?.name}
            </span>
            <span class={styles.activeFileMeta}>
              {converter.sourceDims.width} × {converter.sourceDims.height} px
            </span>
          </div>
          <label for={fileInputId} class={styles.uploadNewBtn}>
            📁 Upload Another Image
          </label>
        </div>
      )}

      {!converter.file && (
        <label
          for={fileInputId}
          class={styles.compactDropZone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer?.files?.[0];
            if (f) onSelectFile(f);
          }}
        >
          <span class={styles.dropZoneHint}>Drop JPG, PNG, or WebP here</span>
        </label>
      )}
    </section>
  );
}

function QualitySection({
  idPrefix,
  converter,
  disabled,
}: {
  idPrefix: string;
  converter: UseImageFormatConverterReturn;
  disabled: boolean;
}) {
  const isLossy = converter.targetFormat === 'jpg' || converter.targetFormat === 'webp';
  if (!isLossy) return null;

  return (
    <div class={styles.qualityRow}>
      <label class={styles.qualityLabel} for={`${idPrefix}-quality`}>
        <span>Quality</span>
        <span class={styles.qualityValue}>{converter.quality}%</span>
      </label>
      <div class={styles.qualityInputRow}>
        <input
          id={`${idPrefix}-quality-slider`}
          aria-label="Level slider"
          type="range"
          min={1}
          max={100}
          value={converter.quality}
          disabled={disabled}
          onInput={(e) => converter.setQuality(Number((e.target as HTMLInputElement).value))}
          class={styles.qualitySlider}
        />
        <input
          id={`${idPrefix}-quality`}
          aria-label="Quality"
          type="number"
          min={1}
          max={100}
          value={converter.quality}
          disabled={disabled}
          onInput={(e) => converter.setQuality(Number((e.target as HTMLInputElement).value))}
          class={styles.qualityNumber}
        />
      </div>
    </div>
  );
}

function FormatSection({
  idPrefix,
  converter,
}: {
  idPrefix: string;
  converter: UseImageFormatConverterReturn;
}) {
  const isExecuting = converter.phase === 'running';
  const hasFile = !!converter.file;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Target Format</span>
        <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
          {converter.targetFormat.toUpperCase()}
        </span>
      </div>

      <label for={`${idPrefix}-output-format`} class="visually-hidden">
        Convert to
      </label>
      <select
        id={`${idPrefix}-output-format`}
        aria-label="Convert to"
        value={converter.targetFormat}
        onChange={(e) =>
          converter.setTargetFormat(
            (e.currentTarget as HTMLSelectElement).value as TargetImageFormat,
          )
        }
        class="visually-hidden"
      >
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
      </select>

      <fieldset class={styles.formatGrid} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Target Image Format</legend>
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            class={styles.formatCard}
            data-active={String(converter.targetFormat === fmt.id)}
            onClick={() => converter.setTargetFormat(fmt.id)}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.formatName}>{fmt.name}</span>
            <span class={styles.formatSub}>{fmt.desc}</span>
          </button>
        ))}
      </fieldset>

      <QualitySection
        idPrefix={idPrefix}
        converter={converter}
        disabled={!hasFile || isExecuting}
      />

      <label class={styles.filenameLabel} for={`${idPrefix}-output-filename`}>
        <span>Output file name</span>
        <input
          id={`${idPrefix}-output-filename`}
          aria-label="Output file name"
          type="text"
          class={styles.filenameInput}
          value={converter.customFileName}
          placeholder={
            converter.file?.name
              ? `${converter.file.name.replace(/\.[^.]+$/, '')}-converted`
              : 'converted-image'
          }
          disabled={!hasFile || isExecuting}
          onInput={(e) => converter.setCustomFileName((e.target as HTMLInputElement).value)}
        />
      </label>

      <div class={styles.panelActions}>
        <button
          type="button"
          class={styles.convertActionBtn}
          data-convert-button=""
          onClick={() => void converter.executeConvert()}
          disabled={!hasFile || isExecuting}
        >
          <span>🔄</span>
          <span>{isExecuting ? 'Converting Image...' : 'Convert Image'}</span>
        </button>
        <button
          type="button"
          class={styles.resetGhostBtn}
          onClick={converter.reset}
          disabled={!hasFile || isExecuting}
        >
          ↺ Reset Settings
        </button>
      </div>
    </section>
  );
}

export function ImageFormatConverterControls(props: ImageFormatConverterControlsProps) {
  return (
    <aside class={styles.controlPanel} aria-label="Image Format Converter Controls">
      <div class={styles.panelCard}>
        <UploadSection
          idPrefix={props.idPrefix}
          preset={props.preset}
          converter={props.converter}
          onSelectFile={props.onSelectFile}
          onTrySample={props.onTrySample}
        />
        <FormatSection idPrefix={props.idPrefix} converter={props.converter} />
      </div>
    </aside>
  );
}
