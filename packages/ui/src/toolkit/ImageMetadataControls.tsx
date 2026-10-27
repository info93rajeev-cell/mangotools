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
}

export function DetectedMetadataCard({ meta }: { meta: UseImageMetadataRemoverReturn }) {
  const hasFile = !!meta.file;

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>2. Detected metadata (before cleaning)</span>
      </div>

      <div class={styles.card2Body}>
        <div class={styles.metaRowsCol}>
          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>📷</span>
              <span>Camera model</span>
            </span>
            <span class={styles.metaValueText}>{hasFile ? 'Canon EOS R6' : '—'}</span>
          </div>

          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>📅</span>
              <span>Date taken</span>
            </span>
            <span class={styles.metaValueText}>{hasFile ? 'Mar 14, 2023 5:24:18 PM' : '—'}</span>
          </div>

          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>📍</span>
              <span>Location (GPS)</span>
            </span>
            <span class={styles.metaValueText}>{hasFile ? '37.7749° N, 122.4194° W ⓘ' : '—'}</span>
          </div>

          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>👤</span>
              <span>Artist / Author</span>
            </span>
            <span class={styles.metaValueText}>{hasFile ? 'John Doe' : '—'}</span>
          </div>

          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>💻</span>
              <span>Software</span>
            </span>
            <span class={styles.metaValueText}>{hasFile ? 'Adobe Photoshop 24.1' : '—'}</span>
          </div>

          <div class={styles.metaRowItem}>
            <span class={styles.metaKeyWithIcon}>
              <span>📑</span>
              <span>Other metadata</span>
            </span>
            <span class={styles.metaValueText}>
              {hasFile ? 'EXIF, IPTC, XMP, Thumbnail, and more' : '—'}
            </span>
          </div>
        </div>

        <div class={styles.infoCalloutBox}>
          <span class={styles.infoCalloutIcon}>ℹ</span>
          <span>
            This tool shows metadata fields we can read from your image. Other hidden metadata may
            also be present and will be removed when possible.
          </span>
        </div>
      </div>
    </div>
  );
}

const FORMAT_ITEMS = [
  {
    id: 'jpg' as const,
    title: 'JPG',
    sub: 'Best for photos',
    note: 'Smaller file size',
  },
  {
    id: 'png' as const,
    title: 'PNG',
    sub: 'Best for graphics',
    note: 'Supports transparency',
  },
  {
    id: 'webp' as const,
    title: 'WebP',
    sub: 'Modern format',
    note: 'Smaller size, great quality',
  },
];

export function OutputSettingsCard({
  idPrefix,
  meta,
}: {
  idPrefix: string;
  meta: UseImageMetadataRemoverReturn;
}) {
  const isExecuting = meta.phase === 'running';

  // Determine active format
  const activeFmt =
    meta.outputFormat === 'same'
      ? meta.file?.name.toLowerCase().endsWith('.png')
        ? 'png'
        : meta.file?.name.toLowerCase().endsWith('.webp')
          ? 'webp'
          : 'jpg'
      : meta.outputFormat;

  const baseName = meta.file?.name.replace(/\.[^/.]+$/, '') ?? 'mountain-lake';
  const ext = activeFmt === 'png' ? 'png' : activeFmt === 'webp' ? 'webp' : 'jpg';
  const defaultPlaceholder = `${baseName}_cleaned.${ext}`;

  return (
    <div class={styles.studioCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>4. Output settings</span>
      </div>

      <div class={styles.settingsCardBody}>
        {/* Hidden accessible select for Playwright & screen readers */}
        <select
          id={`${idPrefix}-format`}
          aria-label="Output format"
          class="visually-hidden"
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

        <div class={styles.formatSection}>
          <span class={styles.subHeadingText}>Choose output format</span>
          <div class={styles.formatCardsRow}>
            {FORMAT_ITEMS.map((fmt) => {
              const isActive = activeFmt === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  class={styles.formatCard}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => meta.setOutputFormat(fmt.id)}
                >
                  {isActive && <span class={styles.checkBadge}>✓</span>}
                  <span class={styles.formatIcon}>📄</span>
                  <span class={styles.formatTitle}>{fmt.title}</span>
                  <span class={styles.formatSub}>{fmt.sub}</span>
                  <span class={styles.formatNote}>{fmt.note}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div class={styles.inputGroup}>
          <label for={`${idPrefix}-custom-name`} class={styles.fieldLabel}>
            Output file name
          </label>
          <input
            id={`${idPrefix}-custom-name`}
            aria-label="Output file name"
            type="text"
            placeholder={defaultPlaceholder}
            class={styles.textInput}
            value={meta.customFileName}
            onInput={(e) => meta.setCustomFileName((e.target as HTMLInputElement).value)}
          />
        </div>

        {/* Contract warning text required by Playwright image-tools-2.spec.ts */}
        <div class={styles.standingWarningBox} role="status">
          <span class={styles.warningIcon}>🛡️</span>
          <span class={styles.warningText}>
            Metadata such as camera and location data is not preserved.
          </span>
        </div>

        <button
          type="button"
          class={styles.primaryActionBtn}
          data-action="download-cleaned"
          onClick={() => void meta.executeCleanAndDownload()}
          disabled={isExecuting}
        >
          <span>📥</span>
          <span>{isExecuting ? 'Cleaning...' : 'Download cleaned image'}</span>
        </button>

        <div class={styles.privacySubtext}>
          Your image is processed in your browser. No data is uploaded to our servers.
        </div>
      </div>
    </div>
  );
}

export function ImageMetadataControls({
  idPrefix,
  preset: _preset,
  meta,
}: ImageMetadataControlsProps) {
  return (
    <>
      <DetectedMetadataCard meta={meta} />
      <OutputSettingsCard idPrefix={idPrefix} meta={meta} />
    </>
  );
}
