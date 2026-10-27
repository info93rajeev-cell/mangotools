import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './passportPhoto.module.css';
import {
  PASSPORT_PRESETS,
  type PassportOutputFormat,
  type UsePassportPhotoReturn,
} from './usePassportPhoto.ts';

export interface PassportPhotoControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  passport: UsePassportPhotoReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

const FORMAT_OPTIONS: { id: PassportOutputFormat; name: string }[] = [
  { id: 'jpg', name: 'JPG' },
  { id: 'png', name: 'PNG' },
  { id: 'webp', name: 'WebP' },
  { id: 'pdf', name: 'PDF' },
];

export function PassportPhotoControls({
  idPrefix,
  preset: _preset,
  passport,
  onSelectFile,
  onTrySample,
}: PassportPhotoControlsProps) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = passport.phase === 'running';
  const hasFile = !!passport.file;

  return (
    <aside class={styles.controlPanel} aria-label="Passport Photo Controls">
      <div class={styles.panelCard}>
        {/* SECTION 1: SOURCE PHOTO */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>1. Portrait Photo</span>
            <div class={styles.headerActions}>
              <button
                type="button"
                class={styles.miniGhostBtn}
                onClick={onTrySample}
                disabled={isExecuting}
              >
                ✨ Try Sample
              </button>
              {hasFile && (
                <button
                  type="button"
                  class={styles.miniGhostBtn}
                  onClick={passport.clearAll}
                  disabled={isExecuting}
                >
                  Clear all
                </button>
              )}
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
              📁 Upload Photo
            </label>
            {hasFile && (
              <div class={styles.inlineFileBadge}>
                <span class={styles.inlineFileName} title={passport.file?.name}>
                  {passport.file?.name}
                </span>
                <span class={styles.inlineFileMeta}>
                  {passport.sourceDims.width}×{passport.sourceDims.height}
                </span>
              </div>
            )}
          </div>

          {!hasFile && (
            <div class={styles.emptyStateNotice}>
              Add a photo, then enter the pixel dimensions required by your application.
            </div>
          )}
        </section>

        {hasFile && (
          <>
            {/* SECTION 2: OFFICIAL PRESETS */}
            <section class={styles.controlSection}>
              <div class={styles.sectionHeader}>
                <span class={styles.sectionTitle}>2. Official Visa & Passport Presets</span>
              </div>
              <div class={styles.presetPillsGrid}>
                {PASSPORT_PRESETS.map((p) => {
                  const isActive = passport.activePresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      class={styles.presetPill}
                      data-active={String(isActive)}
                      onClick={() => passport.applyPreset(p)}
                      disabled={isExecuting}
                    >
                      <span class={styles.presetName}>{p.name}</span>
                      <span class={styles.presetDim}>{p.unit}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECTION 3: TARGET PIXEL DIMENSIONS */}
            <section class={styles.controlSection}>
              <div class={styles.sectionHeader}>
                <span class={styles.sectionTitle}>3. Photo Dimensions</span>
              </div>
              <div class={styles.dimsRow}>
                <div class={styles.dimField}>
                  <label for={`${idPrefix}-target-width`} class={styles.dimLabel}>
                    Photo width
                  </label>
                  <div class={styles.dimInputWrap}>
                    <input
                      id={`${idPrefix}-target-width`}
                      type="number"
                      class={styles.dimInput}
                      value={passport.targetWidth}
                      onInput={(e) =>
                        passport.setWidth(Number((e.target as HTMLInputElement).value))
                      }
                      disabled={isExecuting}
                    />
                    <span class={styles.dimSuffix}>px</span>
                  </div>
                </div>

                <div class={styles.dimField}>
                  <label for={`${idPrefix}-target-height`} class={styles.dimLabel}>
                    Photo height
                  </label>
                  <div class={styles.dimInputWrap}>
                    <input
                      id={`${idPrefix}-target-height`}
                      type="number"
                      class={styles.dimInput}
                      value={passport.targetHeight}
                      onInput={(e) =>
                        passport.setHeight(Number((e.target as HTMLInputElement).value))
                      }
                      disabled={isExecuting}
                    />
                    <span class={styles.dimSuffix}>px</span>
                  </div>
                </div>
              </div>

              <div class={styles.switchRow}>
                <label class={styles.switchLabel}>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Keep aspect ratio"
                    checked={passport.keepAspectRatio}
                    onChange={(e) =>
                      passport.setKeepAspectRatio((e.target as HTMLInputElement).checked)
                    }
                    disabled={isExecuting}
                  />
                  <span>Keep aspect ratio</span>
                </label>
              </div>
            </section>

            {/* SECTION 4: OUTPUT FORMAT & QUALITY */}
            <section class={styles.controlSection}>
              <div class={styles.sectionHeader}>
                <span class={styles.sectionTitle}>4. Output Format & Quality</span>
              </div>
              <div class={styles.formatRow}>
                <div class={styles.formatField}>
                  <label for={`${idPrefix}-output-format`} class={styles.dimLabel}>
                    Output format
                  </label>
                  <select
                    id={`${idPrefix}-output-format`}
                    class={styles.formatSelect}
                    value={passport.outputFormat}
                    onChange={(e) =>
                      passport.setOutputFormat(
                        (e.target as HTMLInputElement).value as PassportOutputFormat,
                      )
                    }
                    disabled={isExecuting}
                  >
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div class={styles.qualityField}>
                  <label for={`${idPrefix}-quality`} class={styles.dimLabel}>
                    Quality
                  </label>
                  <input
                    id={`${idPrefix}-quality`}
                    type="number"
                    min="1"
                    max="100"
                    class={styles.qualityInput}
                    value={passport.quality}
                    onInput={(e) =>
                      passport.setQuality(Number((e.target as HTMLInputElement).value))
                    }
                    disabled={isExecuting || passport.outputFormat === 'png'}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
