import type { ResolvedPreset } from '@mangotools/schemas';
import { Button } from '../primitives/Button.tsx';
import styles from './imageWatermark.module.css';
import type {
  useImageWatermark,
  WatermarkOutputFormat,
  WatermarkPosition,
} from './useImageWatermark.ts';

export interface ImageWatermarkControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: ReturnType<typeof useImageWatermark>;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

type WControls = ReturnType<typeof useImageWatermark>;

const POSITIONS: { id: WatermarkPosition; label: string; icon: string }[] = [
  { id: 'top-left', label: 'TL', icon: '↖' },
  { id: 'top-right', label: 'TR', icon: '↗' },
  { id: 'center', label: 'C', icon: '⊙' },
  { id: 'bottom-left', label: 'BL', icon: '↙' },
  { id: 'bottom-right', label: 'BR', icon: '↘' },
];

const FORMAT_OPTIONS: { id: WatermarkOutputFormat; name: string }[] = [
  { id: 'same', name: 'Same' },
  { id: 'png', name: 'PNG' },
  { id: 'jpg', name: 'JPG' },
  { id: 'webp', name: 'WebP' },
  { id: 'pdf', name: 'PDF' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadSection({
  idPrefix,
  preset,
  watermark,
  onSelectFile,
  onTrySample,
  disabled,
}: {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: WControls;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
  disabled: boolean;
}) {
  const fileInputId = `${idPrefix}-file-input`;
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>1. Upload Image</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {watermark.file && (
            <Button variant="ghost" onClick={watermark.clearAll} disabled={disabled}>
              Clear
            </Button>
          )}
          <Button variant="ghost" icon="sparkle" onClick={onTrySample} disabled={disabled}>
            Try Sample
          </Button>
        </div>
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

      {watermark.file ? (
        <div class={styles.activeFileBadge}>
          <span class={styles.activeFileName} title={watermark.file.name}>
            {watermark.file.name}
          </span>
          <span class={styles.activeFileMeta}>
            {watermark.sourceDims
              ? `${watermark.sourceDims.width} × ${watermark.sourceDims.height} px • `
              : ''}
            {formatBytes(watermark.file.size)}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function WatermarkTextSection({
  idPrefix,
  watermark,
  disabled,
}: {
  idPrefix: string;
  watermark: WControls;
  disabled: boolean;
}) {
  const textId = `${idPrefix}-watermark-text`;
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Watermark Text</span>
      </div>
      <label for={textId} class="visually-hidden">
        Watermark text
      </label>
      <input
        id={textId}
        type="text"
        aria-label="Watermark text"
        class={styles.textInput}
        value={watermark.text}
        placeholder="Enter watermark text..."
        onInput={(e) => watermark.setText((e.target as HTMLInputElement).value)}
        disabled={disabled}
      />
    </section>
  );
}

function PositionSection({
  idPrefix,
  watermark,
  disabled,
}: {
  idPrefix: string;
  watermark: WControls;
  disabled: boolean;
}) {
  const posId = `${idPrefix}-position`;
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Position</span>
      </div>
      <label for={posId} class="visually-hidden">
        Position
      </label>
      <select
        id={posId}
        aria-label="Position"
        class="visually-hidden"
        value={watermark.position}
        onChange={(e) =>
          watermark.setPosition((e.target as HTMLSelectElement).value as WatermarkPosition)
        }
        disabled={disabled}
      >
        {POSITIONS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <div class={styles.positionGrid}>
        {POSITIONS.map((p) => {
          const isActive = watermark.position === p.id;
          return (
            <button
              type="button"
              key={p.id}
              class={`${styles.positionBtn} ${isActive ? styles.positionBtnActive : ''}`}
              onClick={() => watermark.setPosition(p.id)}
              disabled={disabled}
            >
              {p.icon} {p.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StylingSection({
  idPrefix,
  watermark,
  disabled,
}: {
  idPrefix: string;
  watermark: WControls;
  disabled: boolean;
}) {
  const opacityId = `${idPrefix}-opacity`;
  const fontId = `${idPrefix}-font-size`;
  const colorId = `${idPrefix}-color`;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>4. Styling</span>
      </div>

      <div class={styles.dualSliderRow}>
        <div class={styles.sliderCol}>
          <div class={styles.sliderHeader}>
            <span>Opacity: {watermark.opacity}%</span>
          </div>
          <label for={opacityId} class="visually-hidden">
            Opacity
          </label>
          <input
            id={opacityId}
            type="range"
            aria-label="Opacity"
            min="10"
            max="100"
            step="5"
            class={styles.rangeInput}
            value={watermark.opacity}
            onInput={(e) => watermark.setOpacity(Number((e.target as HTMLInputElement).value))}
            disabled={disabled}
          />
        </div>

        <div class={styles.sliderCol}>
          <div class={styles.sliderHeader}>
            <span>Size: {watermark.fontSize}px</span>
          </div>
          <label for={fontId} class="visually-hidden">
            Font size
          </label>
          <input
            id={fontId}
            type="range"
            aria-label="Font size"
            min="12"
            max="120"
            step="2"
            class={styles.rangeInput}
            value={watermark.fontSize}
            onInput={(e) => watermark.setFontSize(Number((e.target as HTMLInputElement).value))}
            disabled={disabled}
          />
        </div>
      </div>

      <div class={styles.colorRow}>
        <label for={colorId} class="visually-hidden">
          Text color
        </label>
        <input
          type="color"
          class={styles.colorPicker}
          value={watermark.color}
          onInput={(e) => watermark.setColor((e.target as HTMLInputElement).value)}
          disabled={disabled}
          title="Choose watermark color"
        />
        <input
          id={colorId}
          type="text"
          aria-label="Text color"
          class={styles.colorTextInput}
          value={watermark.color}
          onInput={(e) => watermark.setColor((e.target as HTMLInputElement).value)}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

function FormatSection({
  idPrefix,
  watermark,
  disabled,
}: {
  idPrefix: string;
  watermark: WControls;
  disabled: boolean;
}) {
  const formatId = `${idPrefix}-output-format`;
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>5. Output Format</span>
      </div>
      <label for={formatId} class="visually-hidden">
        Output format
      </label>
      <select
        id={formatId}
        aria-label="Output format"
        class="visually-hidden"
        value={watermark.outputFormat}
        onChange={(e) =>
          watermark.setOutputFormat((e.target as HTMLSelectElement).value as WatermarkOutputFormat)
        }
        disabled={disabled}
      >
        <option value="same">Same as input</option>
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
        <option value="webp">WebP</option>
        <option value="pdf">PDF</option>
      </select>
      <div class={styles.formatGrid}>
        {FORMAT_OPTIONS.map((opt) => {
          const isActive = watermark.outputFormat === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              class={`${styles.formatOption} ${isActive ? styles.formatOptionActive : ''}`}
              onClick={() => watermark.setOutputFormat(opt.id)}
              disabled={disabled}
            >
              <span class={styles.formatName}>{opt.name}</span>
            </button>
          );
        })}
      </div>

      {(watermark.outputFormat === 'jpg' || watermark.outputFormat === 'webp') && (
        <div class={styles.sliderRow} style={{ marginTop: '4px' }}>
          <div class={styles.sliderHeader}>
            <span>Quality</span>
            <span class={styles.sliderValue}>{watermark.quality}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            class={styles.rangeInput}
            value={watermark.quality}
            onInput={(e) => watermark.setQuality(Number((e.target as HTMLInputElement).value))}
            disabled={disabled}
          />
        </div>
      )}
    </section>
  );
}

export function ImageWatermarkControls({
  idPrefix,
  preset,
  watermark,
  onSelectFile,
  onTrySample,
}: ImageWatermarkControlsProps) {
  const isExecuting = watermark.phase === 'running';

  return (
    <aside class={styles.controlsPanel}>
      <UploadSection
        idPrefix={idPrefix}
        preset={preset}
        watermark={watermark}
        onSelectFile={onSelectFile}
        onTrySample={onTrySample}
        disabled={isExecuting}
      />
      <WatermarkTextSection idPrefix={idPrefix} watermark={watermark} disabled={isExecuting} />
      <PositionSection idPrefix={idPrefix} watermark={watermark} disabled={isExecuting} />
      <StylingSection idPrefix={idPrefix} watermark={watermark} disabled={isExecuting} />
      <FormatSection idPrefix={idPrefix} watermark={watermark} disabled={isExecuting} />
    </aside>
  );
}
