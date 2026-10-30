import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { formatImageBytes } from './imageSizeFormat.ts';
import styles from './photoSizeReducer.module.css';
import { messageFor } from './presentation.ts';
import { NoteList } from './ResultNotices.tsx';
import type { UsePhotoSizeReducerReturn } from './usePhotoSizeReducer.ts';

export interface PhotoSizeReducerResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  photoSize: UsePhotoSizeReducerReturn;
}

const formatBytes = formatImageBytes;

function ResultCockpit({
  preset,
  photoSize,
}: {
  preset: ResolvedPreset;
  photoSize: UsePhotoSizeReducerReturn;
}) {
  if (!photoSize.result) return null;
  const res = photoSize.result;

  return (
    <div class={styles.previewCockpitCard} data-photo-size-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Photo Reduced Successfully</span>
      </div>

      <div class={styles.primaryResultCockpit} data-primary-result="">
        <span class={styles.primaryLabel}>Output size (bytes)</span>
        <output class={styles.primaryValue}>{res.outputFileSize}</output>
      </div>

      <div class={styles.previewThumbContainer}>
        <img
          src={photoSize.resultUrl ?? photoSize.imageSrc ?? ''}
          alt="Reduced result preview"
          class={styles.previewThumb}
        />
      </div>

      <table class={styles.metricsTable} aria-label="Output Photo Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Target Limit</td>
            <td class={styles.metricVal}>
              {res.targetFileSizeBytes ? `≤ ${formatBytes(res.targetFileSizeBytes)}` : 'Auto'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Size</td>
            <td class={styles.metricVal} style={{ fontWeight: 'var(--weight-bold)' }}>
              {formatBytes(res.outputFileSize)}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Original Size</td>
            <td class={styles.metricVal}>{formatBytes(res.originalFileSize)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Reduction</td>
            <td class={styles.metricVal} style={{ color: 'var(--color-success, #16a34a)' }}>
              -{res.sizeChangePercent}%
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Dims</td>
            <td class={styles.metricVal}>
              {res.outputWidth} × {res.outputHeight} px
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Format</td>
            <td class={styles.metricVal}>{res.outputFormat.toUpperCase()}</td>
          </tr>
        </tbody>
      </table>

      {res.warnings && res.warnings.length > 0 && (
        <NoteList preset={preset} notices={res.warnings} />
      )}

      <div class={styles.actionButtonGroup}>
        <button
          type="button"
          class={styles.applyCtaBtn}
          data-action="apply-reduce"
          onClick={() => void photoSize.executeReduce()}
          disabled={photoSize.phase === 'running'}
          title="Re-apply settings and update preview"
        >
          <span>{photoSize.phase === 'running' ? '⏳' : '⚡'}</span>
          <span>{photoSize.phase === 'running' ? 'Reducing photo...' : 'Re-apply Reduction'}</span>
        </button>

        <button
          type="button"
          class={styles.downloadCtaBtn}
          data-action="download-reduced"
          onClick={photoSize.downloadResult}
          disabled={
            photoSize.phase === 'running' ||
            !photoSize.result ||
            !photoSize.resultUrl ||
            photoSize.phase === 'error'
          }
        >
          <span>⬇️</span>
          <span>Download reduced photo</span>
        </button>
      </div>
    </div>
  );
}

function ReadyCockpit({ photoSize }: { photoSize: UsePhotoSizeReducerReturn }) {
  const hasFile = !!photoSize.file;
  const targetLabel = photoSize.maxFileSizeKB ? `≤ ${photoSize.maxFileSizeKB} KB` : 'Auto';

  return (
    <div class={styles.previewCockpitCard} data-photo-size-ready-panel="">
      <div
        class={styles.statusBanner}
        style={{
          background: hasFile ? 'var(--color-bg)' : 'transparent',
          color: 'var(--color-text)',
          borderColor: hasFile ? 'var(--color-border)' : 'transparent',
        }}
      >
        <span>{hasFile ? '✓ Ready to Reduce' : '⏳ Awaiting Photo'}</span>
      </div>

      <div class={styles.previewThumbContainer}>
        {hasFile && photoSize.imageSrc ? (
          <div
            role="presentation"
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${photoSize.imageSrc})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Awaiting Photo</div>
        )}
      </div>

      <table class={styles.metricsTable} aria-label="Target Reduction Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Target Size</td>
            <td class={styles.metricVal}>{targetLabel}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Current Size</td>
            <td class={styles.metricVal}>
              {hasFile ? formatBytes(photoSize.file?.size ?? 0) : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Source Dims</td>
            <td class={styles.metricVal}>
              {hasFile ? `${photoSize.sourceDims.width} × ${photoSize.sourceDims.height} px` : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Allow Smaller Dims</td>
            <td class={styles.metricVal}>
              {photoSize.allowDimensionReduction ? 'Allowed' : 'Off'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Target Format</td>
            <td class={styles.metricVal}>{photoSize.outputFormat.toUpperCase()}</td>
          </tr>
        </tbody>
      </table>

      <div class={styles.trustBadge}>
        <span>🔒</span>
        <span>100% In-Browser. No Files Uploaded.</span>
      </div>

      <div class={styles.actionButtonGroup}>
        <button
          type="button"
          class={styles.applyCtaBtn}
          data-action="apply-reduce"
          onClick={() => void photoSize.executeReduce()}
          disabled={
            photoSize.phase === 'running' ||
            !hasFile ||
            !photoSize.imageSrc ||
            photoSize.phase === 'error'
          }
          title="Apply settings and preview reduced photo quality"
        >
          <span>{photoSize.phase === 'running' ? '⏳' : '⚡'}</span>
          <span>{photoSize.phase === 'running' ? 'Reducing photo...' : 'Reduce Photo Size'}</span>
        </button>

        <button
          type="button"
          class={styles.downloadCtaBtn}
          data-action="download-reduced"
          onClick={() => void photoSize.executeReduceAndDownload()}
          disabled={
            photoSize.phase === 'running' ||
            !hasFile ||
            !photoSize.imageSrc ||
            photoSize.phase === 'error'
          }
        >
          <span>⬇️</span>
          <span>Download reduced photo</span>
        </button>
      </div>
    </div>
  );
}

function ErrorCallout({
  preset,
  photoSize,
}: {
  preset: ResolvedPreset;
  photoSize: UsePhotoSizeReducerReturn;
}) {
  if (!photoSize.error) return null;
  const isUnreachable = photoSize.error.code === 'IMAGE_SIZE_TARGET_UNREACHABLE';
  const msg = isUnreachable
    ? `The size limit was not reached within these settings. Smallest tested: ${photoSize.error.details?.bytes ?? 'N/A'} bytes at ${photoSize.error.details?.width ?? 'N/A'} × ${photoSize.error.details?.height ?? 'N/A'} px (${photoSize.error.details?.attempts ?? '8'} attempts). No file was downloaded. Relax the limit or allow smaller dimensions.`
    : photoSize.error.code === 'INVALID_INPUT'
      ? 'Maximum file size is required. Please enter a valid KB limit.'
      : messageFor(preset, photoSize.error);

  return (
    <div class={styles.errorContainer} data-photo-size-error="">
      <InlineAlert tone="danger" role="alert">
        {msg}
      </InlineAlert>
      {isUnreachable && (
        <div class={styles.honestCallout}>
          <strong>Honest failure guarantee:</strong> MangoTools will never download an oversized
          file that violates your portal's limit. Turn on <em>"Allow smaller dimensions"</em> to
          enable aspect-safe pixel reduction down to 64 px.
        </div>
      )}
    </div>
  );
}

export function PhotoSizeReducerResult({
  idPrefix: _idPrefix,
  preset,
  photoSize,
}: PhotoSizeReducerResultProps) {
  const hasResult = !!photoSize.result && !!photoSize.resultUrl;

  return (
    <aside class={styles.resultPanel} aria-label="Photo Reduction Specs and Results">
      {hasResult ? (
        <ResultCockpit preset={preset} photoSize={photoSize} />
      ) : (
        <ReadyCockpit photoSize={photoSize} />
      )}
      <ErrorCallout preset={preset} photoSize={photoSize} />

      <dl class="visually-hidden">
        <div data-output="outputFileSize">
          <dt>Output size (bytes)</dt>
          <dd>{photoSize.result ? photoSize.result.outputFileSize : ''}</dd>
        </div>
        <div data-output="outputWidth">
          <dt>Output width (px)</dt>
          <dd>{photoSize.result ? photoSize.result.outputWidth : photoSize.sourceDims.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Output height (px)</dt>
          <dd>{photoSize.result ? photoSize.result.outputHeight : photoSize.sourceDims.height}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{photoSize.result ? photoSize.result.outputFormat : photoSize.outputFormat}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original size (bytes)</dt>
          <dd>
            {photoSize.result ? photoSize.result.originalFileSize : (photoSize.file?.size ?? '')}
          </dd>
        </div>
        <div data-output="fileName">
          <dt>Output file</dt>
          <dd>{photoSize.result ? photoSize.result.fileName : ''}</dd>
        </div>
      </dl>
    </aside>
  );
}
