import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import styles from './imageFormatConverter.module.css';
import { formatImageBytes } from './imageSizeFormat.ts';
import { messageFor } from './presentation.ts';
import type { UseImageFormatConverterReturn } from './useImageFormatConverter.ts';

export interface ImageFormatConverterResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  converter: UseImageFormatConverterReturn;
}

const STANDING_WARNING_CODES = new Set([
  'IMAGE_VERIFY_OUTPUT',
  'IMAGE_METADATA_NOT_PRESERVED',
  'IMAGE_LARGE_IMAGES_MAY_FAIL',
]);

function ResultCockpit({
  preset,
  converter,
}: {
  preset: ResolvedPreset;
  converter: UseImageFormatConverterReturn;
}) {
  if (!converter.result) return null;
  const res = converter.result;
  const actionableWarnings = (res.warnings ?? []).filter(
    (w) => !STANDING_WARNING_CODES.has(w.code),
  );

  return (
    <div class={styles.previewCockpitCard} data-convert-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Image Converted Successfully</span>
      </div>

      <div class={styles.previewThumbContainer}>
        <div
          role="presentation"
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${converter.resultUrl ?? converter.imageSrc})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      <table class={styles.metricsTable} aria-label="Output Image Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Original Format</td>
            <td class={styles.metricVal}>{res.originalFormat.toUpperCase()}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Converted To</td>
            <td class={styles.metricVal}>{res.outputFormat.toUpperCase()}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output Dims</td>
            <td class={styles.metricVal}>
              {res.outputWidth} × {res.outputHeight} px
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Output File Size</td>
            <td class={styles.metricVal}>{formatImageBytes(res.outputFileSize)}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Size Difference</td>
            <td class={styles.metricVal}>
              {res.sizeDifferenceBytes >= 0 ? '-' : '+'}
              {Math.abs(Math.round(res.sizeChangePercent))}%
            </td>
          </tr>
        </tbody>
      </table>

      {actionableWarnings.length > 0 && (
        <div class={styles.warningsList} data-warnings="">
          {actionableWarnings.map((w) => (
            <InlineAlert key={w.code} tone="warning" role="status">
              {messageFor(preset, w)}
            </InlineAlert>
          ))}
        </div>
      )}

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-download-converted=""
        onClick={converter.downloadResult}
      >
        <span>⬇️</span>
        <span>Download converted image</span>
      </button>
    </div>
  );
}

function computeEstimatedKb(converter: UseImageFormatConverterReturn): number {
  const baseSize = converter.file?.size ?? 1024 * 500;
  if (converter.targetFormat === 'png') {
    return Math.max(1, Math.round((baseSize * 1.2) / 1024));
  }
  return Math.max(1, Math.round((baseSize * (converter.quality / 100)) / 1024));
}

function ReadyStatusBanner({
  isError,
  hasFile,
  errorText,
}: {
  isError: boolean;
  hasFile: boolean;
  errorText: string;
}) {
  if (isError) {
    return (
      <div
        class={styles.statusBanner}
        role="alert"
        style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }}
      >
        <span>⚠️ {errorText}</span>
      </div>
    );
  }

  return (
    <div
      class={styles.statusBanner}
      role="status"
      style={{
        background: hasFile ? 'var(--color-bg)' : 'transparent',
        color: 'var(--color-text)',
        borderColor: hasFile ? 'var(--color-border)' : 'transparent',
      }}
    >
      <span>{hasFile ? '✓ Ready to Convert' : '⏳ Awaiting Image'}</span>
    </div>
  );
}

function ReadyPreviewThumb({
  hasFile,
  isError,
  imageSrc,
}: {
  hasFile: boolean;
  isError: boolean;
  imageSrc: string | null;
}) {
  if (hasFile && imageSrc) {
    return (
      <div class={styles.previewThumbContainer}>
        <div
          role="presentation"
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
    );
  }

  return (
    <div class={styles.previewThumbContainer}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
        {isError ? 'Unable to load image' : 'Awaiting Image'}
      </div>
    </div>
  );
}

function ReadyCockpit({ converter }: { converter: UseImageFormatConverterReturn }) {
  const hasFile = !!converter.file;
  const isError = converter.phase === 'error' || !!converter.error;
  const estSizeKb = computeEstimatedKb(converter);
  const errorText = resolveImageErrorMessage(converter.error, converter.file?.name);

  return (
    <div class={styles.previewCockpitCard} data-convert-ready-panel="">
      <ReadyStatusBanner isError={isError} hasFile={hasFile} errorText={errorText} />
      <ReadyPreviewThumb hasFile={hasFile} isError={isError} imageSrc={converter.imageSrc} />

      <table class={styles.metricsTable} aria-label="Target Conversion Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Source Format</td>
            <td class={styles.metricVal}>
              {hasFile ? (converter.sourceFormat ?? 'jpg').toUpperCase() : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Target Format</td>
            <td class={styles.metricVal}>{converter.targetFormat.toUpperCase()}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Dimensions</td>
            <td class={styles.metricVal}>
              {hasFile
                ? `${converter.sourceDims.width} × ${converter.sourceDims.height} px (Preserved)`
                : '—'}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Quality</td>
            <td class={styles.metricVal}>
              {converter.targetFormat === 'png' ? 'Lossless (100%)' : `${converter.quality}%`}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Estimated Size</td>
            <td class={styles.metricVal}>{hasFile ? `~${estSizeKb} KB` : '—'}</td>
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
        data-download-converted=""
        onClick={() => void converter.executeConvertAndDownload()}
        disabled={converter.phase === 'running' || isError || !hasFile}
      >
        <span>⬇️</span>
        <span>Download converted image</span>
      </button>
    </div>
  );
}

export function ImageFormatConverterResult({
  idPrefix: _idPrefix,
  preset,
  converter,
}: ImageFormatConverterResultProps) {
  const hasResult = !converter.error && !!converter.result && !!converter.resultUrl;

  return (
    <aside class={styles.resultPanel} aria-label="Conversion Specs and Results">
      {hasResult ? (
        <ResultCockpit preset={preset} converter={converter} />
      ) : (
        <ReadyCockpit converter={converter} />
      )}

      {/* Structured data elements for accessibility and Playwright E2E tests */}
      <div data-primary-result="" class="visually-hidden">
        <output>{converter.result ? converter.result.outputFormat : converter.targetFormat}</output>
      </div>
      <dl class="visually-hidden">
        <div data-output="originalFormat">
          <dt>Original format</dt>
          <dd>
            {converter.result ? converter.result.originalFormat : (converter.sourceFormat ?? 'jpg')}
          </dd>
        </div>
        <div data-output="outputFormat">
          <dt>Converted to</dt>
          <dd>{converter.result ? converter.result.outputFormat : converter.targetFormat}</dd>
        </div>
        <div data-output="outputWidth">
          <dt>Width</dt>
          <dd>{converter.result ? converter.result.outputWidth : converter.sourceDims.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height</dt>
          <dd>{converter.result ? converter.result.outputHeight : converter.sourceDims.height}</dd>
        </div>
        <div data-output="originalWidth">
          <dt>Original Width</dt>
          <dd>{converter.result ? converter.result.originalWidth : converter.sourceDims.width}</dd>
        </div>
        <div data-output="originalHeight">
          <dt>Original Height</dt>
          <dd>
            {converter.result ? converter.result.originalHeight : converter.sourceDims.height}
          </dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Output File Size</dt>
          <dd>{converter.result ? converter.result.outputFileSize : 0}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original File Size</dt>
          <dd>{converter.result ? converter.result.originalFileSize : 0}</dd>
        </div>
        <div data-output="sizeDifferenceBytes">
          <dt>Size Difference</dt>
          <dd>{converter.result ? converter.result.sizeDifferenceBytes : 0}</dd>
        </div>
        <div data-output="fileName">
          <dt>Output file</dt>
          <dd>{converter.result ? converter.result.fileName : ''}</dd>
        </div>
      </dl>
    </aside>
  );
}
