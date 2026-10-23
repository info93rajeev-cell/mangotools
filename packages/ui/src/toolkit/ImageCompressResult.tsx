import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageCompress.module.css';
import { messageFor } from './presentation.ts';
import type { UseImageCompressReturn } from './useImageCompress.ts';

export interface ImageCompressResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  compress: UseImageCompressReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ResultCockpit({ compress }: { compress: UseImageCompressReturn }) {
  if (!compress.result) return null;
  const res = compress.result;

  return (
    <div class={styles.previewCockpitCard} data-compress-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Image Compressed Successfully</span>
      </div>

      <div class={styles.previewThumbContainer}>
        <img
          src={compress.resultUrl ?? compress.imageSrc ?? ''}
          alt="Compressed result preview"
          class={styles.previewThumb}
        />
      </div>

      <table class={styles.metricsTable} aria-label="Output Image Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Original Size</td>
            <td class={styles.metricVal}>{formatBytes(res.originalFileSize)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Compressed Size</td>
            <td class={styles.metricVal} style={{ fontWeight: 'var(--weight-bold)' }}>
              {formatBytes(res.outputFileSize)}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Size Reduction</td>
            <td class={styles.metricVal} style={{ color: 'var(--color-success, #16a34a)' }}>
              -{res.sizeChangePercent}%
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Amount Saved</td>
            <td class={styles.metricVal}>{formatBytes(res.sizeDifferenceBytes)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Format</td>
            <td class={styles.metricVal}>{res.outputFormat.toUpperCase()}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Dimensions</td>
            <td class={styles.metricVal}>
              {res.outputWidth} × {res.outputHeight} px
            </td>
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-action="download-compressed"
        onClick={compress.downloadResult}
        disabled={compress.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download compressed image</span>
      </button>
    </div>
  );
}

function ReadyCockpit({ compress }: { compress: UseImageCompressReturn }) {
  const hasFile = !!compress.file;
  const targetLabel = compress.maxFileSizeKB
    ? `≤ ${compress.maxFileSizeKB} KB`
    : `Quality ${compress.quality}%`;

  return (
    <div class={styles.previewCockpitCard} data-compress-ready-panel="">
      <div
        class={styles.statusBanner}
        style={{
          background: hasFile ? 'var(--color-bg)' : 'transparent',
          color: 'var(--color-text)',
          borderColor: hasFile ? 'var(--color-border)' : 'transparent',
        }}
      >
        <span>{hasFile ? '✓ Ready to Compress' : '⏳ Awaiting Image'}</span>
      </div>

      <div class={styles.previewThumbContainer}>
        {hasFile && compress.imageSrc ? (
          <div
            role="presentation"
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${compress.imageSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Awaiting Image</div>
        )}
      </div>

      <table class={styles.metricsTable} aria-label="Target Compression Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Original Size</td>
            <td class={styles.metricVal}>
              {hasFile ? formatBytes(compress.file?.size ?? 0) : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Target Target</td>
            <td class={styles.metricVal}>{hasFile ? targetLabel : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Format</td>
            <td class={styles.metricVal}>{hasFile ? compress.outputFormat.toUpperCase() : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Source Dims</td>
            <td class={styles.metricVal}>
              {hasFile ? `${compress.sourceDims.width} × ${compress.sourceDims.height} px` : '—'}
            </td>
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
        data-action="download-compressed"
        onClick={() => void compress.executeCompressAndDownload()}
        disabled={compress.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download compressed image</span>
      </button>
    </div>
  );
}

function ErrorCallout({
  preset,
  compress,
}: {
  preset: ResolvedPreset;
  compress: UseImageCompressReturn;
}) {
  if (!compress.error) return null;
  const isNotSmaller = compress.error.code === 'IMAGE_COMPRESSION_NOT_SMALLER';
  const msg = isNotSmaller
    ? 'No smaller result was achieved without degrading quality below 50%.'
    : messageFor(preset, compress.error);

  return (
    <div class={styles.errorContainer} data-compress-error="">
      <InlineAlert tone="danger" role="alert">
        {msg}
      </InlineAlert>
      {isNotSmaller && (
        <div class={styles.honestCallout}>
          <strong class={styles.honestTitle}>Honest compression guarantee:</strong>
          <span class={styles.honestText}>
            MangoTools will never output a file larger than your original. If an image is already
            efficiently compressed, we inform you immediately instead of returning bloated bytes.
          </span>
        </div>
      )}
      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-action="download-compressed"
        onClick={() => void compress.executeCompressAndDownload()}
        disabled={compress.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download compressed image</span>
      </button>
    </div>
  );
}

function resolveFormatName(compress: UseImageCompressReturn): string {
  if (compress.result) return compress.result.outputFormat;
  if (compress.outputFormat !== 'same') return compress.outputFormat;
  return compress.file?.name?.endsWith('.png') ? 'png' : 'jpg';
}

function HiddenMetricsDl({ compress }: { compress: UseImageCompressReturn }) {
  const formatName = resolveFormatName(compress);
  const res = compress.result;
  const dimsText = res
    ? res.dimensions
    : `${compress.sourceDims.width} × ${compress.sourceDims.height}`;

  return (
    <>
      <div data-primary-result="" class="visually-hidden">
        <output>{res ? `${res.sizeChangePercent}%` : ''}</output>
      </div>

      <dl class="visually-hidden">
        <div data-output="sizeChangePercent">
          <dt>Size reduction</dt>
          <dd data-raw-value={res ? res.sizeChangePercent : undefined}>
            {res ? `${res.sizeChangePercent}%` : ''}
          </dd>
        </div>
        <div data-output="sizeDifferenceBytes">
          <dt>Amount saved</dt>
          <dd data-raw-value={res ? res.sizeDifferenceBytes : undefined}>
            {res ? formatBytes(res.sizeDifferenceBytes) : ''}
          </dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Compressed size</dt>
          <dd data-raw-value={res ? res.outputFileSize : undefined}>
            {res ? formatBytes(res.outputFileSize) : ''}
          </dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original size</dt>
          <dd data-raw-value={res ? res.originalFileSize : undefined}>
            {res ? formatBytes(res.originalFileSize) : ''}
          </dd>
        </div>
        <div data-output="outputFormat">
          <dt>Format</dt>
          <dd>{formatName}</dd>
        </div>
        <div data-output="dimensions">
          <dt>Dimensions</dt>
          <dd>{dimsText}</dd>
        </div>
        <div data-output="outputQuality">
          <dt>Output quality</dt>
          <dd>{res ? `${res.outputQuality}%` : `${compress.quality}%`}</dd>
        </div>
      </dl>
    </>
  );
}

export function ImageCompressResult({
  idPrefix: _idPrefix,
  preset,
  compress,
}: ImageCompressResultProps) {
  const hasResult = !!compress.result && !!compress.resultUrl;
  const isError = compress.phase === 'error' && !!compress.error;

  return (
    <aside class={styles.resultPanel} aria-label="Compression Specs and Results">
      {isError ? (
        <ErrorCallout preset={preset} compress={compress} />
      ) : hasResult ? (
        <ResultCockpit compress={compress} />
      ) : (
        <ReadyCockpit compress={compress} />
      )}

      <HiddenMetricsDl compress={compress} />
    </aside>
  );
}
