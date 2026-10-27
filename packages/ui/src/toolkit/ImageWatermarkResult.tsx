import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageWatermark.module.css';
import type { UseImageWatermarkReturn } from './useImageWatermark.ts';

export interface ImageWatermarkResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: UseImageWatermarkReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageWatermarkResult({
  idPrefix: _idPrefix,
  preset: _preset,
  watermark,
}: ImageWatermarkResultProps) {
  const hasFile = !!watermark.file;
  const res = watermark.result;
  const isExecuting = watermark.phase === 'running';

  const originalFmt = watermark.file?.name.toLowerCase().endsWith('.png')
    ? 'png'
    : watermark.file?.name.toLowerCase().endsWith('.webp')
      ? 'webp'
      : 'jpg';
  const displayFmt = res
    ? res.outputFormat
    : watermark.outputFormat === 'same'
      ? originalFmt
      : watermark.outputFormat;

  return (
    <aside class={styles.resultPanel} aria-label="Watermark Output Specs and Download">
      <div class={styles.panelCard}>
        <div class={styles.sectionHeader}>
          <span class={styles.sectionTitle}>5. Output Cockpit</span>
          <span class={styles.readyBadge}>
            {res ? '✓ Watermarked' : hasFile ? 'Ready' : 'Awaiting Photo'}
          </span>
        </div>

        {/* Primary result filename for contract verification */}
        {res && (
          <div class={styles.primaryResultCockpit} data-primary-result="">
            <span class={styles.primaryLabel}>Watermarked file</span>
            <output class={styles.primaryValue}>{res.fileName}</output>
          </div>
        )}

        {/* Specifications Table */}
        <table class={styles.specsTable} aria-label="Watermark specifications">
          <tbody>
            <tr>
              <td class={styles.specKey}>Watermark Text</td>
              <td class={styles.specVal}>{watermark.text.trim() ? `"${watermark.text}"` : '—'}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>Position</td>
              <td class={styles.specVal}>{watermark.position}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>Opacity / Size</td>
              <td class={styles.specVal}>
                {watermark.opacity}% / {watermark.fontSize} px
              </td>
            </tr>
            <tr>
              <td class={styles.specKey}>Output Format</td>
              <td class={styles.specVal}>{displayFmt.toUpperCase()}</td>
            </tr>
            {res && (
              <tr>
                <td class={styles.specKey}>File Size</td>
                <td class={styles.specVal} style={{ fontWeight: 'var(--weight-bold)' }}>
                  {formatBytes(res.outputFileSize)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Error Alert */}
        {watermark.error && (
          <div class={styles.errorContainer} data-watermark-error="">
            <InlineAlert tone="danger" role="alert">
              {watermark.error.message || 'An error occurred.'}
            </InlineAlert>
          </div>
        )}

        {/* Primary Action Button */}
        <div class={styles.actionGroup}>
          <button
            type="button"
            class={styles.primaryActionBtn}
            data-action="download-watermarked"
            onClick={() => void watermark.executeWatermarkAndDownload()}
            disabled={isExecuting}
          >
            <span>⬇️</span>
            <span>{isExecuting ? 'Watermarking...' : 'Download watermarked image'}</span>
          </button>
        </div>
      </div>

      {/* Hidden DL outputs for strict contract compatibility */}
      <dl class="visually-hidden">
        <div data-output="fileName">
          <dt>Watermarked file</dt>
          <dd>{res ? res.fileName : ''}</dd>
        </div>
        <div data-output="watermarkText">
          <dt>Watermark text</dt>
          <dd>{res ? res.watermarkText : watermark.text}</dd>
        </div>
        <div data-output="position">
          <dt>Position</dt>
          <dd>{res ? res.position : watermark.position}</dd>
        </div>
        <div data-output="opacity">
          <dt>Opacity (%)</dt>
          <dd>{res ? res.opacity : watermark.opacity}</dd>
        </div>
        <div data-output="fontSize">
          <dt>Font size (px)</dt>
          <dd>{res ? res.fontSize : watermark.fontSize}</dd>
        </div>
        <div data-output="color">
          <dt>Text color</dt>
          <dd>{res ? res.color : watermark.color}</dd>
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
          <dd>{res ? res.outputWidth : watermark.sourceDims.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height (px)</dt>
          <dd>{res ? res.outputHeight : watermark.sourceDims.height}</dd>
        </div>
        <div data-output="originalWidth">
          <dt>Original width (px)</dt>
          <dd>{res ? res.originalWidth : watermark.sourceDims.width}</dd>
        </div>
        <div data-output="originalHeight">
          <dt>Original height (px)</dt>
          <dd>{res ? res.originalHeight : watermark.sourceDims.height}</dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Output file size (bytes)</dt>
          <dd>{res ? res.outputFileSize : ''}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original file size (bytes)</dt>
          <dd>{res ? res.originalFileSize : (watermark.file?.size ?? '')}</dd>
        </div>
        <div data-output="sizeDifferenceBytes">
          <dt>Size difference (bytes)</dt>
          <dd>{res ? res.sizeDifferenceBytes : ''}</dd>
        </div>
      </dl>
    </aside>
  );
}
