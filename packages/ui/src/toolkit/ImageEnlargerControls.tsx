import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './imageEnlarger.module.css';
import type { EnlargeOutputFormat, UseImageEnlargerReturn } from './useImageEnlarger.ts';

export interface ImageEnlargerControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  enlarger: UseImageEnlargerReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const SCALE_PRESETS: { scale: 1 | 2 | 4; label: string; desc: string }[] = [
  { scale: 1, label: '1×', desc: 'Original' },
  { scale: 2, label: '2× (200%)', desc: 'HD / 2K' },
  { scale: 4, label: '4× (400%)', desc: 'Ultra 4K' },
];

const FORMAT_OPTIONS: { id: EnlargeOutputFormat; name: string }[] = [
  { id: 'png', name: 'PNG' },
  { id: 'jpg', name: 'JPG' },
  { id: 'webp', name: 'WebP' },
  { id: 'pdf', name: 'PDF' },
];

function UploadSection({
  fileInputId,
  preset,
  enlarger,
  onSelectFile,
  onTrySample,
  isExecuting,
}: {
  fileInputId: string;
  preset: ResolvedPreset;
  enlarger: UseImageEnlargerReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
  isExecuting: boolean;
}) {
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>1. Source Photo</span>
        <button
          type="button"
          class={styles.miniGhostBtn}
          onClick={onTrySample}
          disabled={isExecuting}
        >
          ✨ Try Sample
        </button>
      </div>

      <input
        id={fileInputId}
        type="file"
        accept={
          preset.ui.fileAccept ?? 'image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
        }
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) onSelectFile(f);
        }}
      />

      <div class={styles.uploadRow}>
        <label for={fileInputId} class={styles.uploadMainBtn}>
          📁 Upload Image
        </label>
        {enlarger.file && (
          <div class={styles.activeFileBadge}>
            <span class={styles.activeFileName} title={enlarger.file.name}>
              {enlarger.file.name}
            </span>
            <span class={styles.activeFileMeta}>
              {enlarger.sourceDims.width} × {enlarger.sourceDims.height} px
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function ScaleSection({
  enlarger,
  hasFile,
  isExecuting,
}: {
  enlarger: UseImageEnlargerReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>2. Enlarge Resolution</span>
        <span class={styles.sliderVal}>
          {enlarger.sourceDims.width * enlarger.settings.scale} ×{' '}
          {enlarger.sourceDims.height * enlarger.settings.scale} px
        </span>
      </div>

      <div class={styles.presetRow}>
        {SCALE_PRESETS.map((p) => (
          <button
            key={p.scale}
            type="button"
            class={styles.presetBtn}
            data-active={String(enlarger.settings.scale === p.scale)}
            onClick={() => enlarger.setScale(p.scale)}
            disabled={!hasFile || isExecuting}
          >
            <span>{p.label}</span>
            <span style={{ fontSize: '9px', opacity: 0.8 }}>{p.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PrecisionSliders({
  enlarger,
  disabled,
}: {
  enlarger: UseImageEnlargerReturn;
  disabled: boolean;
}) {
  const { sharpness, contrast, brightness, vibrance, warmth } = enlarger.settings;

  return (
    <>
      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span class={styles.sliderLabel}>Sharpness & Clarity</span>
          <span class={styles.sliderVal}>{sharpness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={sharpness}
          class={styles.sliderInput}
          onInput={(e) => enlarger.setSharpness((e.target as HTMLInputElement).valueAsNumber)}
          disabled={disabled}
          aria-label="Sharpness and Clarity"
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span class={styles.sliderLabel}>Contrast (S-Curve)</span>
          <span class={styles.sliderVal}>
            {contrast > 0 ? '+' : ''}
            {contrast}%
          </span>
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          step="5"
          value={contrast}
          class={styles.sliderInput}
          onInput={(e) => enlarger.setContrast((e.target as HTMLInputElement).valueAsNumber)}
          disabled={disabled}
          aria-label="Contrast"
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span class={styles.sliderLabel}>Brightness & Exposure</span>
          <span class={styles.sliderVal}>
            {brightness > 0 ? '+' : ''}
            {brightness}%
          </span>
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          step="5"
          value={brightness}
          class={styles.sliderInput}
          onInput={(e) => enlarger.setBrightness((e.target as HTMLInputElement).valueAsNumber)}
          disabled={disabled}
          aria-label="Brightness"
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span class={styles.sliderLabel}>Vibrance & Color Depth</span>
          <span class={styles.sliderVal}>
            {vibrance > 0 ? '+' : ''}
            {vibrance}%
          </span>
        </div>
        <input
          type="range"
          min="-50"
          max="100"
          step="5"
          value={vibrance}
          class={styles.sliderInput}
          onInput={(e) => enlarger.setVibrance((e.target as HTMLInputElement).valueAsNumber)}
          disabled={disabled}
          aria-label="Vibrance"
        />
      </div>

      <div class={styles.sliderRow}>
        <div class={styles.sliderHeader}>
          <span class={styles.sliderLabel}>Color Warmth</span>
          <span class={styles.sliderVal}>
            {warmth > 0 ? '+' : ''}
            {warmth}%
          </span>
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          step="5"
          value={warmth}
          class={styles.sliderInput}
          onInput={(e) => enlarger.setWarmth((e.target as HTMLInputElement).valueAsNumber)}
          disabled={disabled}
          aria-label="Warmth"
        />
      </div>
    </>
  );
}

function EnhancerSection({
  enlarger,
  hasFile,
  isExecuting,
}: {
  enlarger: UseImageEnlargerReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  const disabled = !hasFile || isExecuting;

  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>3. Pro Quality Enhancer</span>
        <button
          type="button"
          class={styles.stageBtn}
          onClick={enlarger.resetSettings}
          disabled={disabled}
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>

      <button
        type="button"
        class={styles.autoEnhanceBtn}
        data-active={String(enlarger.isAutoEnhance)}
        onClick={enlarger.toggleAutoEnhance}
        disabled={disabled}
      >
        <span>⚡</span>
        <span>{enlarger.isAutoEnhance ? 'Auto Enhance Active' : '1-Click Auto Enhance'}</span>
      </button>

      <PrecisionSliders enlarger={enlarger} disabled={disabled} />
    </section>
  );
}

function OutputSection({
  enlarger,
  hasFile,
  isExecuting,
}: {
  enlarger: UseImageEnlargerReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  return (
    <section class={styles.controlSection}>
      <div class={styles.sectionHeader}>
        <span class={styles.sectionTitle}>4. Output Format</span>
      </div>
      <div class={styles.formatRow}>
        {FORMAT_OPTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            class={styles.formatBtn}
            data-active={String(enlarger.outputFormat === f.id)}
            onClick={() => enlarger.setOutputFormat(f.id)}
            disabled={!hasFile || isExecuting}
          >
            {f.name}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ImageEnlargerControls({
  idPrefix,
  preset,
  enlarger,
  onSelectFile,
  onTrySample,
}: ImageEnlargerControlsProps) {
  const fileInputId = `${idPrefix}-file-input`;
  const hasFile = !!enlarger.file;
  const isExecuting = enlarger.phase === 'running';

  return (
    <aside class={styles.controlsPanel} aria-label="Enhancement Controls">
      <UploadSection
        fileInputId={fileInputId}
        preset={preset}
        enlarger={enlarger}
        onSelectFile={onSelectFile}
        onTrySample={onTrySample}
        isExecuting={isExecuting}
      />
      <ScaleSection enlarger={enlarger} hasFile={hasFile} isExecuting={isExecuting} />
      <EnhancerSection enlarger={enlarger} hasFile={hasFile} isExecuting={isExecuting} />
      <OutputSection enlarger={enlarger} hasFile={hasFile} isExecuting={isExecuting} />
    </aside>
  );
}
