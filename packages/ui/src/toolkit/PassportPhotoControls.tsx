import type { ResolvedPreset } from '@mangotools/schemas';
import { PassportSheetControls } from './PassportSheetControls.tsx';
import styles from './passportPhoto.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
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

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio controls layout
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

          <UniversalUploadDropzone
            idPrefix={fileInputId}
            accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            file={passport.file}
            thumbnailUrl={passport.imageSrc}
            dimensions={passport.sourceDims.width ? passport.sourceDims : null}
            onSelectFile={onSelectFile}
            onClear={passport.clearAll}
            disabled={isExecuting}
            primaryText="Drag and drop images here"
            browseText="click to browse files"
            supportHint="Supports JPG, PNG, WebP, BMP. You can upload multiple images at once."
          />

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
                      <span class={styles.presetName}>
                        {isActive ? '✓ ' : ''}
                        {p.name}
                      </span>
                      <span class={styles.presetDim}>{p.unit}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECTION 3: TARGET PIXEL DIMENSIONS & RATIO LOCK */}
            <section class={styles.controlSection}>
              <div class={styles.sectionHeader}>
                <span class={styles.sectionTitle}>3. Photo Dimensions</span>
                <label class={styles.switchLabel}>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Keep aspect ratio"
                    aria-checked={passport.keepAspectRatio}
                    checked={passport.keepAspectRatio}
                    onChange={(e) =>
                      passport.setKeepAspectRatio((e.target as HTMLInputElement).checked)
                    }
                    disabled={isExecuting}
                  />
                  <span>Ratio Lock</span>
                </label>
              </div>
              <div class={styles.dimsRow}>
                <div class={styles.dimField}>
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
                    <span class={styles.dimSuffix}>W px</span>
                  </div>
                </div>

                <div class={styles.dimField}>
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
                    <span class={styles.dimSuffix}>H px</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: STUDIO PRINT SHEET SETUP */}
            <PassportSheetControls idPrefix={idPrefix} passport={passport} disabled={isExecuting} />

            {/* SECTION 5: OUTPUT FORMAT & QUALITY */}
            <section class={styles.controlSection}>
              <div class={styles.sectionHeader}>
                <span class={styles.sectionTitle}>5. Output Format & Quality</span>
              </div>
              <div class={styles.formatRow}>
                <div class={styles.formatField} style={{ flex: 1.5 }}>
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

                <div class={styles.qualityField} style={{ flex: 1.2 }}>
                  <input
                    id={`${idPrefix}-quality`}
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Q"
                    class={styles.qualityInput}
                    value={passport.quality}
                    onInput={(e) =>
                      passport.setQuality(Number((e.target as HTMLInputElement).value))
                    }
                    disabled={isExecuting || passport.outputFormat === 'png'}
                  />
                </div>

                <div style={{ flex: 2 }}>
                  <input
                    id={`${idPrefix}-custom-filename`}
                    type="text"
                    placeholder="Filename"
                    class={styles.dimInput}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={passport.customFileName}
                    onInput={(e) =>
                      passport.setCustomFileName((e.target as HTMLInputElement).value)
                    }
                    disabled={isExecuting}
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
