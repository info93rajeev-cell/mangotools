import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './signatureResizer.module.css';
import {
  SIGNATURE_PRESETS,
  type SignatureOutputFormat,
  type SignaturePresetItem,
  type UseSignatureResizerReturn,
} from './useSignatureResizer.ts';

export interface SignatureResizerControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  signature: UseSignatureResizerReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

export function SignatureResizerControls({
  idPrefix,
  preset: _preset,
  signature,
  onSelectFile,
  onTrySample,
}: SignatureResizerControlsProps) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = signature.phase === 'running';
  const hasFile = !!signature.file;

  return (
    <aside class={styles.controlPanel} aria-label="Signature Controls">
      <div class={styles.panelCard}>
        {/* SECTION 1: SOURCE SIGNATURE */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>1. Signature Image</span>
            <div class={styles.headerActions}>
              <button
                type="button"
                class={styles.miniGhostBtn}
                onClick={onTrySample}
                disabled={isExecuting}
              >
                ✨ Sample
              </button>
              <button
                type="button"
                class={styles.miniGhostBtn}
                onClick={signature.clearAll}
                disabled={isExecuting}
              >
                Clear all
              </button>
            </div>
          </div>

          <input
            id={fileInputId}
            type="file"
            accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              const f = target.files?.[0];
              target.value = '';
              if (f) onSelectFile(f);
            }}
          />

          <div class={styles.uploadRow}>
            <label for={fileInputId} class={styles.uploadMainBtn}>
              📁 Choose Signature
            </label>
            {hasFile && (
              <span class={styles.fileNameBadge} title={signature.file?.name}>
                {signature.file?.name}
              </span>
            )}
          </div>
        </section>

        {/* SECTION 2: OFFICIAL EXAM & PORTAL PRESETS */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>2. Exam & Portal Presets</span>
          </div>
          <div class={styles.presetPillGrid}>
            {SIGNATURE_PRESETS.map((p: SignaturePresetItem) => {
              const isActive =
                signature.targetWidth === p.width &&
                signature.targetHeight === p.height &&
                (p.maxKB === undefined || signature.maxFileSizeKB === p.maxKB);
              return (
                <button
                  key={p.id}
                  type="button"
                  class={`${styles.presetPill} ${isActive ? styles.presetPillActive : ''}`}
                  onClick={() => signature.applyPreset(p)}
                  title={p.hint}
                >
                  <span class={styles.pillLabel}>{p.label}</span>
                  <span class={styles.pillDims}>
                    {p.width}×{p.height}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: EXACT PIXEL DIMENSIONS (Strict tab order: width -> height) */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>3. Exact Dimensions (px)</span>
          </div>
          <div class={styles.fieldGrid}>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-width`} class={styles.fieldLabel}>
                Signature width
              </label>
              <input
                id={`${idPrefix}-width`}
                type="number"
                min="1"
                max="20000"
                class={styles.textInput}
                value={signature.targetWidth > 0 ? String(signature.targetWidth) : ''}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  signature.setTargetWidth(val ? Number(val) : 0);
                }}
              />
            </div>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-height`} class={styles.fieldLabel}>
                Signature height
              </label>
              <input
                id={`${idPrefix}-height`}
                type="number"
                min="1"
                max="20000"
                class={styles.textInput}
                value={signature.targetHeight > 0 ? String(signature.targetHeight) : ''}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  signature.setTargetHeight(val ? Number(val) : 0);
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: OUTPUT FORMAT & MAX KB LIMIT */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>4. Format & KB Limit</span>
          </div>
          <div class={styles.fieldGrid}>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-format`} class={styles.fieldLabel}>
                Output format
              </label>
              <select
                id={`${idPrefix}-format`}
                class={styles.selectInput}
                value={signature.outputFormat}
                onChange={(e) =>
                  signature.setOutputFormat(
                    (e.target as HTMLSelectElement).value as SignatureOutputFormat,
                  )
                }
              >
                <option value="jpg">JPG (white background)</option>
                <option value="png">PNG (retain transparency)</option>
              </select>
            </div>
            <div class={styles.fieldItem}>
              <label for={`${idPrefix}-limit`} class={styles.fieldLabel}>
                Maximum file size
              </label>
              <input
                id={`${idPrefix}-limit`}
                type="number"
                min="1"
                max="25000"
                placeholder="Optional"
                class={styles.textInput}
                value={
                  signature.maxFileSizeKB !== undefined && signature.maxFileSizeKB > 0
                    ? String(signature.maxFileSizeKB)
                    : ''
                }
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  signature.setMaxFileSizeKB(val ? Number(val) : undefined);
                }}
              />
            </div>
          </div>

          {signature.outputFormat === 'jpg' && (
            <div class={styles.sliderRow} style={{ marginTop: '8px' }}>
              <div class={styles.sliderHeader}>
                <label for={`${idPrefix}-quality`} class={styles.fieldLabel}>
                  Maximum JPEG quality
                </label>
                <span class={styles.sliderVal}>{signature.quality}%</span>
              </div>
              <input
                id={`${idPrefix}-quality`}
                type="range"
                min="50"
                max="100"
                aria-label="Maximum JPEG quality"
                value={signature.quality}
                class={styles.rangeSlider}
                onInput={(e) => signature.setQuality(Number((e.target as HTMLInputElement).value))}
              />
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
