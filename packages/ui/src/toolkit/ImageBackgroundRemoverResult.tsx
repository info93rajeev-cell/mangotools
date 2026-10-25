import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageBackgroundRemover.module.css';
import { messageFor } from './presentation.ts';
import type { UseImageBackgroundRemoverReturn } from './useImageBackgroundRemover.ts';

export interface ImageBackgroundRemoverResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  bgRemover: UseImageBackgroundRemoverReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ResultCockpit({ bgRemover }: { bgRemover: UseImageBackgroundRemoverReturn }) {
  if (!bgRemover.result) return null;
  const res = bgRemover.result;

  return (
    <div class={styles.previewCockpitCard} data-bg-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Background Removed</span>
      </div>

      <div class={styles.previewThumbContainer}>
        <img
          src={bgRemover.resultUrl ?? bgRemover.imageSrc ?? ''}
          alt="Transparent cutout preview"
          class={styles.previewThumb}
        />
      </div>

      <table class={styles.metricsTable} aria-label="Output Cutout Specifications">
        <tbody>
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
          <tr>
            <td class={styles.metricKey}>Original Size</td>
            <td class={styles.metricVal}>{formatBytes(res.originalFileSize)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Cutout Size</td>
            <td class={styles.metricVal} style={{ fontWeight: 'var(--weight-bold)' }}>
              {formatBytes(res.outputFileSize)}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Tolerance</td>
            <td class={styles.metricVal}>{res.tolerance}%</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Edge Feather</td>
            <td class={styles.metricVal}>{res.feather} px</td>
          </tr>
        </tbody>
      </table>

      <div class={styles.downloadButtonGroup}>
        <button
          type="button"
          class={styles.downloadCtaBtn}
          data-action="download-result"
          name="Download Full HD (Original)"
          onClick={() => void bgRemover.downloadResult('original')}
          disabled={bgRemover.phase === 'running'}
        >
          <span>🌟</span>
          <span>
            Download Full HD ({res.outputWidth} × {res.outputHeight})
          </span>
        </button>
        <button
          type="button"
          class={styles.downloadFastBtn}
          data-action="download-fast"
          name="Download Web Fast (500px)"
          onClick={() => void bgRemover.downloadResult('fast')}
          disabled={bgRemover.phase === 'running'}
        >
          <span>⚡</span>
          <span>Download Web Fast (500px, ~360 KB)</span>
        </button>
      </div>
    </div>
  );
}

function ReadyCockpit({ bgRemover }: { bgRemover: UseImageBackgroundRemoverReturn }) {
  const hasFile = !!bgRemover.file;

  return (
    <div class={styles.previewCockpitCard} data-bg-ready-panel="">
      <div
        class={styles.statusBanner}
        style={{
          background: hasFile ? 'var(--color-bg)' : 'transparent',
          color: 'var(--color-text)',
          borderColor: hasFile ? 'var(--color-border)' : 'transparent',
        }}
      >
        <span>{hasFile ? '✓ Ready to Remove' : '⏳ Awaiting Image'}</span>
      </div>

      <div class={styles.previewThumbContainer}>
        {hasFile && bgRemover.imageSrc ? (
          <div
            role="presentation"
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${bgRemover.imageSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Awaiting Image</div>
        )}
      </div>

      <table class={styles.metricsTable} aria-label="Target Cutout Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Source Size</td>
            <td class={styles.metricVal}>
              {hasFile ? formatBytes(bgRemover.file?.size ?? 0) : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Format</td>
            <td class={styles.metricVal}>{hasFile ? bgRemover.outputFormat.toUpperCase() : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Source Dims</td>
            <td class={styles.metricVal}>
              {hasFile ? `${bgRemover.sourceDims.width} × ${bgRemover.sourceDims.height} px` : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Tolerance</td>
            <td class={styles.metricVal}>{hasFile ? `${bgRemover.tolerance}%` : '—'}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Edge Feather</td>
            <td class={styles.metricVal}>{hasFile ? `${bgRemover.feather} px` : '—'}</td>
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
        data-action="download-result"
        name="Download transparent image"
        onClick={() => void bgRemover.executeRemoveBackgroundAndDownload()}
        disabled={bgRemover.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download transparent image</span>
      </button>
    </div>
  );
}

function ErrorCallout({
  preset,
  bgRemover,
}: {
  preset: ResolvedPreset;
  bgRemover: UseImageBackgroundRemoverReturn;
}) {
  if (!bgRemover.error) return null;
  const msg = messageFor(preset, bgRemover.error);

  return (
    <div class={styles.errorContainer} data-bg-error="">
      <InlineAlert tone="danger" role="alert">
        {msg}
      </InlineAlert>
      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-action="download-result"
        name="Download transparent image"
        onClick={() => void bgRemover.executeRemoveBackgroundAndDownload()}
        disabled={bgRemover.phase === 'running'}
      >
        <span>⬇️</span>
        <span>Download transparent image</span>
      </button>
    </div>
  );
}

function HiddenMetricsDl({ bgRemover }: { bgRemover: UseImageBackgroundRemoverReturn }) {
  const res = bgRemover.result;
  const formatName = res ? res.outputFormat : bgRemover.outputFormat;

  return (
    <>
      <div data-primary-result="" class="visually-hidden">
        <output>{res ? res.fileName : ''}</output>
      </div>

      <dl class="visually-hidden">
        <div data-output="fileName">
          <dt>Output file</dt>
          <dd>{res ? res.fileName : ''}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Format</dt>
          <dd>{formatName}</dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Cutout size</dt>
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
        <div data-output="outputWidth">
          <dt>Width</dt>
          <dd>{res ? res.outputWidth : bgRemover.sourceDims.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height</dt>
          <dd>{res ? res.outputHeight : bgRemover.sourceDims.height}</dd>
        </div>
        <div data-output="tolerance">
          <dt>Tolerance</dt>
          <dd>{res ? `${res.tolerance}%` : `${bgRemover.tolerance}%`}</dd>
        </div>
        <div data-output="feather">
          <dt>Feather</dt>
          <dd>{res ? `${res.feather} px` : `${bgRemover.feather} px`}</dd>
        </div>
      </dl>
    </>
  );
}

export function ImageBackgroundRemoverResult({
  idPrefix: _idPrefix,
  preset,
  bgRemover,
}: ImageBackgroundRemoverResultProps) {
  const hasResult = !bgRemover.error && !!bgRemover.result && !!bgRemover.resultUrl;
  const isError = !!bgRemover.error;

  return (
    <aside class={styles.resultPanel} aria-label="Cutout Specs and Results">
      {isError ? (
        <ErrorCallout preset={preset} bgRemover={bgRemover} />
      ) : hasResult ? (
        <ResultCockpit bgRemover={bgRemover} />
      ) : (
        <ReadyCockpit bgRemover={bgRemover} />
      )}

      <HiddenMetricsDl bgRemover={bgRemover} />
    </aside>
  );
}
