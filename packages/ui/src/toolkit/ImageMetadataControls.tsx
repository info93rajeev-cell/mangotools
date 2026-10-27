import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './imageMetadata.module.css';
import type {
  MetadataOutputFormat,
  UseImageMetadataRemoverReturn,
} from './useImageMetadataRemover.ts';

export interface ImageMetadataControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  meta: UseImageMetadataRemoverReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
}

export function ImageMetadataControls({
  idPrefix,
  preset: _preset,
  meta,
  onSelectFile,
  onTrySample,
}: ImageMetadataControlsProps) {
  const fileInputId = `${idPrefix}-file-input`;
  const isExecuting = meta.phase === 'running';
  const hasFile = !!meta.file;

  return (
    <aside class={styles.controlPanel} aria-label="Metadata Remover Controls">
      <div class={styles.panelCard}>
        {/* SECTION 1: SOURCE PHOTO */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>1. Source Photo</span>
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
                onClick={meta.clearAll}
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
              📁 Choose Image
            </label>
            {hasFile && (
              <span class={styles.fileNameBadge} title={meta.file?.name}>
                {meta.file?.name}
              </span>
            )}
          </div>
        </section>

        {/* SECTION 2: PRIVACY AUDIT STRIP CHECKLIST */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>2. Privacy Shield</span>
          </div>
          <div class={styles.privacyAuditCard}>
            <div class={styles.auditRow}>
              <span class={styles.auditIcon}>📍</span>
              <span class={styles.auditLabel}>GPS & Geolocation Tags</span>
              <span class={styles.auditStatus}>Removed</span>
            </div>
            <div class={styles.auditRow}>
              <span class={styles.auditIcon}>📷</span>
              <span class={styles.auditLabel}>Camera & Lens EXIF Specs</span>
              <span class={styles.auditStatus}>Removed</span>
            </div>
            <div class={styles.auditRow}>
              <span class={styles.auditIcon}>🕒</span>
              <span class={styles.auditLabel}>Capture Date & Time Records</span>
              <span class={styles.auditStatus}>Removed</span>
            </div>
            <div class={styles.auditRow}>
              <span class={styles.auditIcon}>👤</span>
              <span class={styles.auditLabel}>Photoshop, XMP & Serial IDs</span>
              <span class={styles.auditStatus}>Removed</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: OUTPUT FORMAT & CUSTOM FILE NAME */}
        <section class={styles.controlSection}>
          <div class={styles.sectionHeader}>
            <span class={styles.sectionTitle}>3. Output Settings</span>
          </div>

          <div class={styles.fieldItem}>
            <label for={`${idPrefix}-format`} class={styles.fieldLabel}>
              Output format
            </label>
            <select
              id={`${idPrefix}-format`}
              class={styles.selectInput}
              value={meta.outputFormat}
              onChange={(e) =>
                meta.setOutputFormat((e.target as HTMLSelectElement).value as MetadataOutputFormat)
              }
            >
              <option value="same">Same as input</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div class={styles.fieldItem} style={{ marginTop: '6px' }}>
            <label for={`${idPrefix}-custom-name`} class={styles.fieldLabel}>
              Output file name
            </label>
            <input
              id={`${idPrefix}-custom-name`}
              type="text"
              placeholder="e.g. image-cleaned.jpg"
              class={styles.textInput}
              value={meta.customFileName}
              onInput={(e) => meta.setCustomFileName((e.target as HTMLInputElement).value)}
            />
          </div>

          {(meta.outputFormat === 'jpg' || meta.outputFormat === 'webp') && (
            <div class={styles.sliderRow} style={{ marginTop: '6px' }}>
              <div class={styles.sliderHeader}>
                <label for={`${idPrefix}-quality`} class={styles.fieldLabel}>
                  Quality
                </label>
                <span class={styles.sliderVal}>{meta.quality}%</span>
              </div>
              <input
                id={`${idPrefix}-quality`}
                type="range"
                min="50"
                max="100"
                aria-label="Quality"
                value={meta.quality}
                class={styles.rangeSlider}
                onInput={(e) => meta.setQuality(Number((e.target as HTMLInputElement).value))}
              />
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
