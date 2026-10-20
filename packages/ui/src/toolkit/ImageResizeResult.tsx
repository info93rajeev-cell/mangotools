import styles from './imageResize.module.css';
import type { UseImageResizeReturn } from './useImageResize.ts';

export interface ImageResizeResultProps {
  idPrefix: string;
  resize: UseImageResizeReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ResultCockpit({ resize }: { resize: UseImageResizeReturn }) {
  if (!resize.result) return null;
  const res = resize.result;

  return (
    <div class={styles.previewCockpitCard} data-resize-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Image Resized Successfully</span>
      </div>

      <div class={styles.previewThumbContainer}>
        <img
          src={resize.resultUrl ?? ''}
          alt="Resized result preview"
          class={styles.previewThumb}
        />
      </div>

      <table class={styles.metricsTable} aria-label="Output Image Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Output Dims</td>
            <td class={styles.metricVal}>
              {res.outputWidth} × {res.outputHeight} px
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output File Size</td>
            <td class={styles.metricVal}>{formatBytes(res.outputFileSize)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Size Difference</td>
            <td class={styles.metricVal}>
              {res.sizeDifferenceBytes >= 0 ? '-' : '+'}
              {Math.abs(Math.round(res.sizeChangePercent))}%
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Format</td>
            <td class={styles.metricVal}>{res.outputFormat.toUpperCase()}</td>
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-download-resized=""
        onClick={resize.downloadResult}
      >
        <span>⬇️</span>
        <span>Download resized image</span>
      </button>
    </div>
  );
}

function ReadyCockpit({ resize }: { resize: UseImageResizeReturn }) {
  const hasFile = !!resize.file;
  const estSizeKb = Math.max(
    1,
    Math.round(
      ((resize.file?.size ?? 1024 * 500) * (resize.targetWidth * resize.targetHeight)) /
        Math.max(1, resize.sourceDims.width * resize.sourceDims.height) /
        1024,
    ),
  );

  return (
    <div class={styles.previewCockpitCard} data-resize-ready-panel="">
      <div
        class={styles.statusBanner}
        style={{
          background: hasFile ? 'var(--color-bg)' : 'transparent',
          color: 'var(--color-text)',
          borderColor: hasFile ? 'var(--color-border)' : 'transparent',
        }}
      >
        <span>{hasFile ? '✓ Ready to Resize' : '⏳ Awaiting Image'}</span>
      </div>

      <div class={styles.previewThumbContainer}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '24px' }}>
          {hasFile ? '🖼️' : '⏳'}
        </div>
      </div>

      <table class={styles.metricsTable} aria-label="Target Resize Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Source Dims</td>
            <td class={styles.metricVal}>
              {hasFile ? `${resize.sourceDims.width} × ${resize.sourceDims.height} px` : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Target Dims</td>
            <td class={styles.metricVal}>
              {hasFile
                ? `${Math.round(resize.targetWidth)} × ${Math.round(resize.targetHeight)} px`
                : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Scale Factor</td>
            <td class={styles.metricVal}>{hasFile ? `${resize.scalePercent}%` : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Estimated Size</td>
            <td class={styles.metricVal}>{hasFile ? `~${estSizeKb} KB` : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Aspect Ratio</td>
            <td class={styles.metricVal}>{resize.lockAspectRatio ? 'Locked' : 'Custom'}</td>
          </tr>
        </tbody>
      </table>

      <div class={styles.trustBadge}>
        <span>🔒</span>
        <span>100% In-Browser. No Files Uploaded.</span>
      </div>

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-download-resized=""
        onClick={() => void resize.executeResizeAndDownload()}
        disabled={resize.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download resized image</span>
      </button>
    </div>
  );
}

export function ImageResizeResult({ idPrefix: _idPrefix, resize }: ImageResizeResultProps) {
  const hasResult = !!resize.result && !!resize.resultUrl;

  return (
    <aside class={styles.resultPanel} aria-label="Resize Specs and Results">
      {hasResult ? <ResultCockpit resize={resize} /> : <ReadyCockpit resize={resize} />}

      <div data-primary-result="" class="visually-hidden">
        <output>{resize.result ? resize.result.outputWidth : resize.targetWidth}</output>
      </div>
      <dl class="visually-hidden">
        <div data-output="outputWidth">
          <dt>Width</dt>
          <dd>{resize.result ? resize.result.outputWidth : resize.targetWidth}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height</dt>
          <dd>{resize.result ? resize.result.outputHeight : resize.targetHeight}</dd>
        </div>
        <div data-output="originalWidth">
          <dt>Original Width</dt>
          <dd>{resize.result ? resize.result.originalWidth : resize.sourceDims.width}</dd>
        </div>
        <div data-output="originalHeight">
          <dt>Original Height</dt>
          <dd>{resize.result ? resize.result.originalHeight : resize.sourceDims.height}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Format</dt>
          <dd>
            {resize.result
              ? resize.result.outputFormat
              : resize.outputFormat === 'same'
                ? resize.file?.name?.endsWith('.png')
                  ? 'png'
                  : 'jpg'
                : resize.outputFormat}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
