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

export function TransparencyRow({
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
      <span class={styles.dimLabel}>Matte Mode:</span>
      <div class={styles.bgOptionsRow}>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.transparencyMode === 'auto')}
          onClick={() => bgRemover.setTransparencyMode('auto')}
          disabled={!hasFile || isExecuting}
          title="Automatic edge refinement & subtle translucency"
        >
          <span>✨ Auto</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.transparencyMode === 'glass')}
          onClick={() => bgRemover.setTransparencyMode('glass')}
          disabled={!hasFile || isExecuting}
          title="Enhanced glass, transparent bottles, veils & reflections"
        >
          <span>💎 Glass</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.transparencyMode === 'solid')}
          onClick={() => bgRemover.setTransparencyMode('solid')}
          disabled={!hasFile || isExecuting}
          title="Solid cutout for opaque objects"
        >
          <span>🛡️ Solid</span>
        </button>
      </div>
    </div>
  );
}

export function ProductShadowRow({
  idPrefix,
  bgRemover,
  hasFile,
  isExecuting,
}: {
  idPrefix: string;
  bgRemover: UseImageBackgroundRemoverReturn;
  hasFile: boolean;
  isExecuting: boolean;
}) {
  return (
    <div class={styles.sliderGroup}>
      <span class={styles.dimLabel}>Product Shadow:</span>
      <div class={styles.bgOptionsRow}>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.shadowMode === 'none')}
          onClick={() => bgRemover.setShadowMode('none')}
          disabled={!hasFile || isExecuting}
          title="Crisp product cutout without shadow"
        >
          <span>🚫 None</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.shadowMode === 'contact')}
          onClick={() => bgRemover.setShadowMode('contact')}
          disabled={!hasFile || isExecuting}
          title="Floor contact shadow for shoes, bottles, electronics"
        >
          <span>🛋️ Floor</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.shadowMode === 'drop')}
          onClick={() => bgRemover.setShadowMode('drop')}
          disabled={!hasFile || isExecuting}
          title="Floating 3D studio drop shadow"
        >
          <span>🫧 Drop</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.shadowMode === 'original')}
          onClick={() => bgRemover.setShadowMode('original')}
          disabled={!hasFile || isExecuting}
          title="Extract natural shadow from original photo"
        >
          <span>📸 Cast</span>
        </button>
      </div>

      {bgRemover.shadowMode !== 'none' && (
        <div style={{ marginTop: '3px' }}>
          <div class={styles.sliderHeader}>
            <label for={`${idPrefix}-shadow-opacity`} class={styles.dimLabel}>
              Shadow Darkness:
            </label>
            <span class={styles.sliderValText}>{bgRemover.shadowOpacity}%</span>
          </div>
          <input
            id={`${idPrefix}-shadow-opacity`}
            aria-label="Shadow darkness"
            type="range"
            min="10"
            max="100"
            step="5"
            value={bgRemover.shadowOpacity}
            onInput={(e) => {
              bgRemover.setShadowOpacity(Number((e.currentTarget as HTMLInputElement).value));
            }}
            class={styles.rangeSlider}
            disabled={!hasFile || isExecuting}
          />
        </div>
      )}
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
          title="Transparent background (PNG/WebP)"
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
          title="Amazon & Marketplace compliant Pure White (RGB 255, 255, 255)"
        >
          <span
            class={styles.colorSwatch}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
          />
          <span>Pure White</span>
        </button>
        <button
          type="button"
          class={styles.bgOptBtn}
          data-active={String(bgRemover.replacementBackground === '#000000')}
          onClick={() => bgRemover.setReplacementBackground('#000000')}
          disabled={!hasFile || isExecuting}
          title="Pure Black studio background"
        >
          <span class={styles.colorSwatch} style={{ background: '#000000' }} />
          <span>Black</span>
        </button>
      </div>
      {bgRemover.replacementBackground === '#ffffff' && (
        <span
          style={{
            display: 'block',
            fontSize: '9px',
            color: '#b45309',
            marginTop: '2px',
            lineHeight: '1.2',
          }}
        >
          Opaque white background baked in. Select Clear for transparent cutout.
        </span>
      )}
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

      <TransparencyRow bgRemover={bgRemover} hasFile={hasFile} isExecuting={isExecuting} />
      <ProductShadowRow
        idPrefix={idPrefix}
        bgRemover={bgRemover}
        hasFile={hasFile}
        isExecuting={isExecuting}
      />
      <BackgroundFillRow bgRemover={bgRemover} hasFile={hasFile} isExecuting={isExecuting} />
    </section>
  );
}
