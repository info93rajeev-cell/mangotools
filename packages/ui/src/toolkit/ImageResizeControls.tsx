import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import styles from './imageResize.module.css';
import type { ResizeOutputFormat, UseImageResizeReturn } from './useImageResize.ts';

export interface ImageResizeControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  resize: UseImageResizeReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const SCALE_PRESETS = [25, 50, 75, 100, 150, 200];

const FORMAT_OPTIONS: { id: ResizeOutputFormat; name: string; desc: string }[] = [
  { id: 'same', name: 'Same', desc: 'Auto' },
  { id: 'jpg', name: 'JPG', desc: 'Photo' },
  { id: 'png', name: 'PNG', desc: 'Lossless' },
  { id: 'webp', name: 'WebP', desc: 'Small' },
];

function UploadSection({
  idPrefix,
  preset,
  resize,
  onSelectFile,
  onTrySample,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  resize: UseImageResizeReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = resize.phase === 'running';

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

      {!resize.file ? (
        <div class={styles.uploadRow}>
          <label for={fileInputId} class={styles.uploadMainBtn}>
            📁 Upload Image
          </label>
        </div>
      ) : (
        <div class={styles.activeFileWrapper}>
          <div class={styles.activeFileBadge}>
            <span class={styles.activeFileName} title={resize.file?.name}>
              {resize.file?.name}
            </span>
            <span class={styles.activeFileMeta}>
              {resize.sourceDims.width} × {resize.sourceDims.height} px
            </span>
          </div>
          <label for={fileInputId} class={styles.uploadNewBtn}>
            📁 Upload Another Image
          </label>
        </div>
      )}

      {!resize.file && (
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

function DimensionsSection({
  idPrefix,
  resize,
}: {
  idPrefix: string;
  resize: UseImageResizeReturn;
}) {
  const isExecuting = resize.phase === 'running';
  const hasFile = !!resize.file;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Target Dimensions</span>
        <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
          {resize.scalePercent}%
        </span>
      </div>

      <div class={styles.dimsInputsGrid}>
        <div class={styles.dimField}>
          <label class={styles.dimLabel} for={`${idPrefix}-target-width`}>
            Width
          </label>
          <div class={styles.dimInputWrapper}>
            <input
              id={`${idPrefix}-target-width`}
              type="number"
              class={styles.dimInput}
              value={resize.targetWidth}
              disabled={!hasFile || isExecuting}
              onInput={(e) => resize.setWidth(Number((e.target as HTMLInputElement).value))}
            />
            <span class={styles.dimSuffix}>px</span>
          </div>
        </div>

        <div class={styles.dimField}>
          <label class={styles.dimLabel} for={`${idPrefix}-target-height`}>
            Height
          </label>
          <div class={styles.dimInputWrapper}>
            <input
              id={`${idPrefix}-target-height`}
              type="number"
              class={styles.dimInput}
              value={resize.targetHeight}
              disabled={!hasFile || isExecuting}
              onInput={(e) => resize.setHeight(Number((e.target as HTMLInputElement).value))}
            />
            <span class={styles.dimSuffix}>px</span>
          </div>
        </div>
      </div>

      <div class={styles.lockToggleRow}>
        <label class={styles.lockToggleLabel}>
          <input
            type="checkbox"
            role="switch"
            aria-label="Keep aspect ratio"
            aria-checked={resize.lockAspectRatio}
            checked={resize.lockAspectRatio}
            onChange={resize.toggleLock}
            disabled={!hasFile || isExecuting}
          />
          <span>🔒 Lock aspect ratio</span>
        </label>
      </div>

      <fieldset class={styles.scalePresetsRow} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Quick Scale Presets</legend>
        {SCALE_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            class={styles.scalePresetBtn}
            data-active={String(resize.scalePercent === pct)}
            onClick={() => resize.setScalePercent(pct)}
            disabled={!hasFile || isExecuting}
          >
            {pct}%
          </button>
        ))}
      </fieldset>
    </section>
  );
}

function FormatSection({ idPrefix, resize }: { idPrefix: string; resize: UseImageResizeReturn }) {
  const isExecuting = resize.phase === 'running';
  const hasFile = !!resize.file;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Output Format</span>
        <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
          {resize.outputFormat.toUpperCase()}
        </span>
      </div>

      <label for={`${idPrefix}-output-format`} class="visually-hidden">
        Output format
      </label>
      <select
        id={`${idPrefix}-output-format`}
        aria-label="Output format"
        value={resize.outputFormat}
        onChange={(e) =>
          resize.setOutputFormat((e.currentTarget as HTMLSelectElement).value as ResizeOutputFormat)
        }
        class="visually-hidden"
      >
        <option value="same">Same as input</option>
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
      </select>

      <fieldset class={styles.formatGrid} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend class="visually-hidden">Output Image Format</legend>
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            class={styles.formatCard}
            data-active={String(resize.outputFormat === fmt.id)}
            onClick={() => resize.setOutputFormat(fmt.id)}
            disabled={!hasFile || isExecuting}
          >
            <span class={styles.formatName}>{fmt.name}</span>
            <span class={styles.formatSub}>{fmt.desc}</span>
          </button>
        ))}
      </fieldset>

      <label class={styles.filenameLabel} for={`${idPrefix}-output-filename`}>
        <span>Output file name</span>
        <input
          id={`${idPrefix}-output-filename`}
          type="text"
          class={styles.filenameInput}
          value={resize.customFileName}
          placeholder={
            resize.file?.name
              ? `${resize.file.name.replace(/\.[^.]+$/, '')}-resized`
              : 'image-resized'
          }
          disabled={!hasFile || isExecuting}
          onInput={(e) => resize.setCustomFileName((e.target as HTMLInputElement).value)}
        />
      </label>

      <div class={styles.panelActions}>
        <button
          type="button"
          class={styles.resizeActionBtn}
          data-resize-button=""
          onClick={() => void resize.executeResize()}
          disabled={!hasFile || isExecuting}
        >
          <span>📐</span>
          <span>{isExecuting ? 'Resizing Image...' : 'Resize Image'}</span>
        </button>
        <button
          type="button"
          class={styles.resetGhostBtn}
          onClick={resize.reset}
          disabled={!hasFile || isExecuting}
        >
          ↺ Reset Dimensions
        </button>
      </div>
    </section>
  );
}

export function ImageResizeControls(props: ImageResizeControlsProps) {
  return (
    <aside class={styles.controlPanel} aria-label="Image Resize Controls">
      <div class={styles.panelCard}>
        <UploadSection
          idPrefix={props.idPrefix}
          preset={props.preset}
          resize={props.resize}
          onSelectFile={props.onSelectFile}
          onTrySample={props.onTrySample}
        />
        <DimensionsSection idPrefix={props.idPrefix} resize={props.resize} />
        <FormatSection idPrefix={props.idPrefix} resize={props.resize} />
      </div>
    </aside>
  );
}
