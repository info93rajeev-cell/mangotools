import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageMetadata.module.css';
import type { UseImageMetadataRemoverReturn } from './useImageMetadataRemover.ts';

export interface ImageMetadataResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  meta: UseImageMetadataRemoverReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageMetadataResult({
  idPrefix: _idPrefix,
  preset: _preset,
  meta,
}: ImageMetadataResultProps) {
  const hasFile = !!meta.file;
  const res = meta.result;
  const isExecuting = meta.phase === 'running';

  const originalFmt = meta.file?.name.toLowerCase().endsWith('.png')
    ? 'png'
    : meta.file?.name.toLowerCase().endsWith('.webp')
      ? 'webp'
      : 'jpg';
  const displayFmt = res
    ? res.outputFormat
    : meta.outputFormat === 'same'
      ? originalFmt
      : meta.outputFormat;

  return (
    <aside class={styles.resultPanel} aria-label="Metadata Output Specs and Download">
      <div class={styles.panelCard}>
        <div class={styles.sectionHeader}>
          <span class={styles.sectionTitle}>4. Output Cockpit</span>
          <span class={styles.readyBadge}>
            {res ? '✓ Cleaned' : hasFile ? 'Ready' : 'Awaiting Photo'}
          </span>
        </div>

        {/* Primary result filename for contract verification */}
        {res && (
          <div class={styles.primaryResultCockpit} data-primary-result="">
            <span class={styles.primaryLabel}>Cleaned file</span>
            <output class={styles.primaryValue}>{res.fileName}</output>
          </div>
        )}

        {/* Specifications Table */}
        <table class={styles.specsTable} aria-label="Metadata cleaning specifications">
          <tbody>
            <tr>
              <td class={styles.specKey}>Resolution</td>
              <td class={styles.specVal}>
                {meta.sourceDims.width} × {meta.sourceDims.height} px
              </td>
            </tr>
            <tr>
              <td class={styles.specKey}>Output Format</td>
              <td class={styles.specVal}>{displayFmt.toUpperCase()}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>EXIF / GPS Data</td>
              <td class={styles.specVal} style={{ color: 'var(--color-success, #16a34a)' }}>
                Purged / Stripped
              </td>
            </tr>
            {res && (
              <tr>
                <td class={styles.specKey}>Cleaned Size</td>
                <td class={styles.specVal} style={{ fontWeight: 'var(--weight-bold)' }}>
                  {formatBytes(res.outputFileSize)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Standing Warning: Required by E2E test */}
        <div class={styles.standingWarningBox} role="status">
          <span class={styles.warningIcon}>🛡️</span>
          <span class={styles.warningText}>
            Metadata such as camera and location data is not preserved.
          </span>
        </div>

        {/* Error Alert */}
        {meta.error && (
          <div class={styles.errorContainer} data-error="">
            <InlineAlert tone="danger" role="alert">
              {meta.error.message || 'An error occurred.'}
            </InlineAlert>
          </div>
        )}

        {/* Primary Action Button */}
        <div class={styles.actionGroup}>
          <button
            type="button"
            class={styles.primaryActionBtn}
            data-action="download-cleaned"
            onClick={() => void meta.executeCleanAndDownload()}
            disabled={isExecuting}
          >
            <span>⬇️</span>
            <span>{isExecuting ? 'Cleaning...' : 'Download cleaned image'}</span>
          </button>
        </div>
      </div>

      {/* Hidden DL outputs for strict contract compatibility */}
      <dl class="visually-hidden">
        <div data-output="fileName">
          <dt>Cleaned file</dt>
          <dd>{res ? res.fileName : ''}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{displayFmt}</dd>
        </div>
        <div data-output="originalFormat">
          <dt>Original format</dt>
          <dd>{res ? res.originalFormat : originalFmt}</dd>
        </div>
        <div data-output="outputWidth">
          <dt>Width (px)</dt>
          <dd>{res ? res.outputWidth : meta.sourceDims.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height (px)</dt>
          <dd>{res ? res.outputHeight : meta.sourceDims.height}</dd>
        </div>
        <div data-output="originalWidth">
          <dt>Original width (px)</dt>
          <dd>{res ? res.originalWidth : meta.sourceDims.width}</dd>
        </div>
        <div data-output="originalHeight">
          <dt>Original height (px)</dt>
          <dd>{res ? res.originalHeight : meta.sourceDims.height}</dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Output file size (bytes)</dt>
          <dd>{res ? res.outputFileSize : ''}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original file size (bytes)</dt>
          <dd>{res ? res.originalFileSize : (meta.file?.size ?? '')}</dd>
        </div>
        <div data-output="sizeDifferenceBytes">
          <dt>Size difference (bytes)</dt>
          <dd>{res ? res.sizeDifferenceBytes : ''}</dd>
        </div>
      </dl>
    </aside>
  );
}
