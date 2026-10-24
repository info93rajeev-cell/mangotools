import styles from './imageBackgroundRemover.module.css';
import type { UseImageBackgroundRemoverReturn } from './useImageBackgroundRemover.ts';

export function ModeSelectorRow({
  bgRemover,
  hasFile,
  isExecuting,
}: {
  bgRemover: UseImageBackgroundRemoverReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  return (
    <div class={styles.sliderGroup}>
      <span class={styles.dimLabel}>Removal Mode:</span>
      <div class={styles.bgOptionsRow}>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.removalMode === 'universal')}
          onClick={() => bgRemover.setRemovalMode('universal')}
          disabled={!hasFile || isExecuting}
          title="Universal object & portrait segmentation (AI)"
        >
          <span>✨ Universal</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.removalMode === 'portrait')}
          onClick={() => bgRemover.setRemovalMode('portrait')}
          disabled={!hasFile || isExecuting}
          title="Instant person & portrait segmentation"
        >
          <span>👤 Person</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.removalMode === 'solid')}
          onClick={() => bgRemover.setRemovalMode('solid')}
          disabled={!hasFile || isExecuting}
          title="Solid Color / Graphic eraser"
        >
          <span>🎨 Chroma</span>
        </button>
      </div>
    </div>
  );
}

export function BackgroundFillRow({
  bgRemover,
  hasFile,
  isExecuting,
}: {
  bgRemover: UseImageBackgroundRemoverReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  return (
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
  );
}

export function PrecisionSection({
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
        <span class={styles.badgeHint}>
          {bgRemover.removalMode === 'universal'
            ? 'AI Universal'
            : bgRemover.removalMode === 'portrait'
              ? 'AI Person'
              : `${bgRemover.tolerance}% Tol`}
        </span>
      </div>

      <ModeSelectorRow bgRemover={bgRemover} hasFile={hasFile} isExecuting={isExecuting} />

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

      <BackgroundFillRow bgRemover={bgRemover} hasFile={hasFile} isExecuting={isExecuting} />
    </section>
  );
}
