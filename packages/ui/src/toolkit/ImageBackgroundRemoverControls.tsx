import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import styles from './imageBackgroundRemover.module.css';
import type {
  BgOutputFormat,
  UseImageBackgroundRemoverReturn,
} from './useImageBackgroundRemover.ts';

export interface ImageBackgroundRemoverControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  bgRemover: UseImageBackgroundRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const FORMAT_OPTIONS: { id: BgOutputFormat; name: string; desc: string }[] = [
  { id: 'png', name: 'PNG', desc: 'Transparent' },
  { id: 'webp', name: 'WebP', desc: 'Small' },
  { id: 'jpg', name: 'JPG', desc: 'Solid' },
  { id: 'pdf', name: 'PDF', desc: 'Document' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadSection({
  idPrefix,
  preset,
  bgRemover,
  onSelectFile,
  onTrySample,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  bgRemover: UseImageBackgroundRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = bgRemover.phase === 'running';

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

      <div class={styles.uploadRow}>
        <label for={fileInputId} class={styles.uploadMainBtn} data-upload-button="">
          📁 Upload Image
        </label>
      </div>

      {bgRemover.file ? (
        <div class={styles.activeFileBadge}>
          <span class={styles.activeFileName} title={bgRemover.file?.name}>
            {bgRemover.file?.name}
          </span>
          <span class={styles.activeFileMeta}>
            {bgRemover.sourceDims.width} × {bgRemover.sourceDims.height} px •{' '}
            {formatBytes(bgRemover.file.size)}
          </span>
        </div>
      ) : (
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

function PrecisionSection({
  idPrefix,
  bgRemover,
}: {
  idPrefix: string;
  bgRemover: UseImageBackgroundRemoverReturn;
}) {
  const hasFile = !!bgRemover.file;
  const isExecuting = bgRemover.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Removal Precision</span>
        <span class={styles.badgeHint}>{bgRemover.tolerance}% Tol</span>
      </div>

      {/* TOLERANCE SLIDER */}
      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <label for={`${idPrefix}-tolerance`} class={styles.dimLabel}>
            Color Tolerance:
          </label>
          <span class={styles.sliderValText}>{bgRemover.tolerance}%</span>
        </div>
        <input
          id={`${idPrefix}-tolerance`}
          aria-label="Color tolerance"
          type="range"
          min="1"
          max="100"
          step="1"
          value={bgRemover.tolerance}
          onInput={(e) => {
            bgRemover.setTolerance(Number((e.currentTarget as HTMLInputElement).value));
          }}
          class={styles.rangeSlider}
          disabled={!hasFile || isExecuting}
        />
      </div>

      {/* FEATHER SLIDER */}
      <div class={styles.sliderGroup}>
        <div class={styles.sliderHeader}>
          <label for={`${idPrefix}-feather`} class={styles.dimLabel}>
            Edge Smoothing:
          </label>
          <span class={styles.sliderValText}>{bgRemover.feather} px</span>
        </div>
        <input
          id={`${idPrefix}-feather`}
          aria-label="Edge smoothing"
          type="range"
          min="0"
          max="10"
          step="1"
          value={bgRemover.feather}
          onInput={(e) => {
            bgRemover.setFeather(Number((e.currentTarget as HTMLInputElement).value));
          }}
          class={styles.rangeSlider}
          disabled={!hasFile || isExecuting}
        />
      </div>

      {/* REPLACEMENT BACKGROUND */}
      <div class={styles.sliderGroup}>
        <span class={styles.dimLabel}>Background Fill:</span>
        <div class={styles.bgOptionsRow}>
          <button
            type="button"
            class={styles.bgOptBtn}
            data-active={String(bgRemover.replacementBackground === 'transparent')}
            onClick={() => bgRemover.setReplacementBackground('transparent')}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.colorSwatch} style={{ background: '#e2e8f0' }} />
            <span>Clear</span>
          </button>
          <button
            type="button"
            class={styles.bgOptBtn}
            data-active={String(bgRemover.replacementBackground === '#ffffff')}
            onClick={() => bgRemover.setReplacementBackground('#ffffff')}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.colorSwatch} style={{ background: '#ffffff' }} />
            <span>White</span>
          </button>
          <button
            type="button"
            class={styles.bgOptBtn}
            data-active={String(bgRemover.replacementBackground === '#000000')}
            onClick={() => bgRemover.setReplacementBackground('#000000')}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.colorSwatch} style={{ background: '#000000' }} />
            <span>Black</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function FormatSection({
  idPrefix,
  bgRemover,
}: {
  idPrefix: string;
  bgRemover: UseImageBackgroundRemoverReturn;
}) {
  const hasFile = !!bgRemover.file;
  const isExecuting = bgRemover.phase === 'running';

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Output Format</span>
        <span class={styles.badgeHint}>{bgRemover.outputFormat.toUpperCase()}</span>
      </div>

      <label for={`${idPrefix}-output-format`} class="visually-hidden">
        Output format
      </label>
      <select
        id={`${idPrefix}-output-format`}
        aria-label="Output format"
        value={bgRemover.outputFormat}
        onChange={(e) =>
          bgRemover.setOutputFormat((e.currentTarget as HTMLSelectElement).value as BgOutputFormat)
        }
        class="visually-hidden"
      >
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
        <option value="jpg">JPG</option>
        <option value="pdf">PDF</option>
      </select>

      <fieldset class={styles.formatGrid} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Output Image Format</legend>
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            class={styles.formatCard}
            data-active={String(bgRemover.outputFormat === fmt.id)}
            onClick={() => bgRemover.setOutputFormat(fmt.id)}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.formatName}>{fmt.name}</span>
            <span class={styles.formatDesc}>{fmt.desc}</span>
          </button>
        ))}
      </fieldset>
    </section>
  );
}

function ActionSection({
  idPrefix,
  bgRemover,
}: {
  idPrefix: string;
  bgRemover: UseImageBackgroundRemoverReturn;
}) {
  const hasFile = !!bgRemover.file;
  const isExecuting = bgRemover.phase === 'running';

  return (
    <section class={styles.actionSection}>
      <label for={`${idPrefix}-file-name`} class="visually-hidden">
        Output file name
      </label>
      <input
        id={`${idPrefix}-file-name`}
        aria-label="Output file name"
        type="text"
        placeholder={
          bgRemover.file?.name
            ? `${bgRemover.file.name.replace(/\.[^.]+$/, '')}-no-bg`
            : 'output-name'
        }
        value={bgRemover.customFileName}
        onInput={(e) => bgRemover.setCustomFileName((e.currentTarget as HTMLInputElement).value)}
        class={styles.textInput}
        disabled={!hasFile || isExecuting}
      />

      <button
        type="button"
        class={styles.executeBtn}
        data-action="remove-background"
        onClick={() => void bgRemover.executeRemoveBackground()}
        disabled={!hasFile || isExecuting}
      >
        <span>{isExecuting ? '⏳ Removing...' : '✨ Remove Background'}</span>
      </button>

      <button
        type="button"
        class={styles.resetBtn}
        onClick={bgRemover.reset}
        disabled={isExecuting}
      >
        ↺ Reset Settings
      </button>
    </section>
  );
}

export function ImageBackgroundRemoverControls({
  idPrefix,
  preset,
  bgRemover,
  onSelectFile,
  onTrySample,
}: ImageBackgroundRemoverControlsProps) {
  return (
    <aside class={styles.controlsPanel} aria-label="Background Removal Controls">
      <UploadSection
        idPrefix={idPrefix}
        preset={preset}
        bgRemover={bgRemover}
        onSelectFile={onSelectFile}
        onTrySample={onTrySample}
      />
      <PrecisionSection idPrefix={idPrefix} bgRemover={bgRemover} />
      <FormatSection idPrefix={idPrefix} bgRemover={bgRemover} />
      <ActionSection idPrefix={idPrefix} bgRemover={bgRemover} />
    </aside>
  );
}
