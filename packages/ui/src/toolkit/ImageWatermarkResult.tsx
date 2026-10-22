import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageWatermark.module.css';
import { messageFor } from './presentation.ts';
import type { ImageWatermarkResultData, useImageWatermark } from './useImageWatermark.ts';

export interface ImageWatermarkResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: ReturnType<typeof useImageWatermark>;
}

type WResult = ReturnType<typeof useImageWatermark>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ResultCockpit({
  res,
  watermark,
  disabled,
}: {
  res: ImageWatermarkResultData;
  watermark: WResult;
  disabled: boolean;
}) {
  return (
    <div class={styles.previewCockpitCard} data-watermark-result="">
      <div class={styles.statusBanner} role="status">
        <span>✓</span>
        <span>Watermark Applied</span>
      </div>

      <table class={styles.metricsTable} aria-label="Watermarked Output Specifications">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Format</td>
            <td class={styles.metricVal}>{res.outputFormat.toUpperCase()}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Dimensions</td>
            <td class={styles.metricVal}>
              {res.outputWidth} × {res.outputHeight} px
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Watermark</td>
            <td
              class={styles.metricVal}
              style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              "{res.watermarkText}"
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Position</td>
            <td class={styles.metricVal}>{res.position}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Opacity</td>
            <td class={styles.metricVal}>{res.opacity}%</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>File Size</td>
            <td class={styles.metricVal} style={{ fontWeight: 'var(--weight-bold)' }}>
              {formatBytes(res.outputFileSize)}
            </td>
          </tr>
        </tbody>
      </table>

      <div class={styles.nameRow}>
        <label class={styles.nameLabel} for="watermark-output-name">
          File Name
        </label>
        <input
          id="watermark-output-name"
          aria-label="Output file name"
          type="text"
          class={styles.nameInput}
          value={watermark.customFileName || res.fileName}
          placeholder={res.fileName}
          onInput={(e) => watermark.setCustomFileName((e.target as HTMLInputElement).value)}
        />
      </div>

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-action="download-result"
        name="Download watermarked image"
        aria-label="Download watermarked image"
        onClick={() => void watermark.executeAndDownload()}
        disabled={disabled}
      >
        <span>⬇️</span>
        <span>Download watermarked image</span>
      </button>
    </div>
  );
}

function ReadyCockpit({ watermark, disabled }: { watermark: WResult; disabled: boolean }) {
  const hasFile = !!watermark.file;

  return (
    <div class={styles.previewCockpitCard} data-watermark-ready-panel="">
      <div
        class={styles.statusBanner}
        style={{
          background: hasFile ? 'var(--color-bg)' : 'transparent',
          color: 'var(--color-text)',
          borderColor: hasFile ? 'var(--color-border)' : 'transparent',
        }}
      >
        <span>{hasFile ? '✓ Ready to Watermark' : '⏳ Awaiting Image'}</span>
      </div>

      <table class={styles.metricsTable} aria-label="Pending Watermark Configuration">
        <tbody>
          <tr>
            <td class={styles.metricKey}>Target Format</td>
            <td class={styles.metricVal}>
              {watermark.outputFormat === 'same'
                ? 'Same as input'
                : watermark.outputFormat.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Position</td>
            <td class={styles.metricVal}>{watermark.position}</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Opacity</td>
            <td class={styles.metricVal}>{watermark.opacity}%</td>
          </tr>
          <tr>
            <td class={styles.metricKey}>Font Size</td>
            <td class={styles.metricVal}>{watermark.fontSize} px</td>
          </tr>
        </tbody>
      </table>

      <div class={styles.nameRow}>
        <label class={styles.nameLabel} for="watermark-custom-name">
          Custom File Name (Optional)
        </label>
        <input
          id="watermark-custom-name"
          aria-label="Output file name"
          type="text"
          class={styles.nameInput}
          value={watermark.customFileName}
          placeholder="e.g. photo-marked"
          onInput={(e) => watermark.setCustomFileName((e.target as HTMLInputElement).value)}
          disabled={!hasFile || disabled}
        />
      </div>

      <button
        type="button"
        class={styles.downloadCtaBtn}
        data-action="download-result"
        name="Download watermarked image"
        aria-label="Download watermarked image"
        onClick={() => void watermark.executeAndDownload()}
        disabled={disabled}
      >
        <span>⬇️</span>
        <span>Download watermarked image</span>
      </button>
    </div>
  );
}

interface WatermarkMetrics {
  fileName: string;
  watermarkText: string;
  position: string;
  opacity: number;
  fontSize: number;
  color: string;
  outputFormat: string;
  originalFormat: string;
  width: number;
  height: number;
  outputFileSize: number | undefined;
  originalFileSize: number | undefined;
}

function getWatermarkMetrics(watermark: WResult): WatermarkMetrics {
  const res = watermark.result;
  if (res) {
    return {
      fileName: res.fileName,
      watermarkText: res.watermarkText,
      position: res.position,
      opacity: res.opacity,
      fontSize: res.fontSize,
      color: res.color,
      outputFormat: res.outputFormat,
      originalFormat: res.originalFormat,
      width: res.outputWidth,
      height: res.outputHeight,
      outputFileSize: res.outputFileSize,
      originalFileSize: res.originalFileSize,
    };
  }
  return {
    fileName: '',
    watermarkText: watermark.text,
    position: watermark.position,
    opacity: watermark.opacity,
    fontSize: watermark.fontSize,
    color: watermark.color,
    outputFormat: watermark.outputFormat,
    originalFormat: '',
    width: watermark.sourceDims?.width ?? 0,
    height: watermark.sourceDims?.height ?? 0,
    outputFileSize: undefined,
    originalFileSize: undefined,
  };
}

function HiddenMetricsDl({ watermark }: { watermark: WResult }) {
  const m = getWatermarkMetrics(watermark);

  return (
    <>
      <div data-primary-result="" class="visually-hidden">
        <output>{m.fileName}</output>
      </div>

      <dl class="visually-hidden">
        <div data-output="fileName">
          <dt>Watermarked file</dt>
          <dd>{m.fileName}</dd>
        </div>
        <div data-output="watermarkText">
          <dt>Watermark text</dt>
          <dd>{m.watermarkText}</dd>
        </div>
        <div data-output="position">
          <dt>Position</dt>
          <dd>{m.position}</dd>
        </div>
        <div data-output="opacity">
          <dt>Opacity</dt>
          <dd>{m.opacity}</dd>
        </div>
        <div data-output="fontSize">
          <dt>Font size</dt>
          <dd>{m.fontSize}</dd>
        </div>
        <div data-output="color">
          <dt>Color</dt>
          <dd>{m.color}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{m.outputFormat}</dd>
        </div>
        <div data-output="originalFormat">
          <dt>Original format</dt>
          <dd>{m.originalFormat}</dd>
        </div>
        <div data-output="outputWidth">
          <dt>Width</dt>
          <dd>{m.width}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Height</dt>
          <dd>{m.height}</dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Output size</dt>
          <dd data-raw-value={m.outputFileSize}>
            {m.outputFileSize !== undefined ? formatBytes(m.outputFileSize) : ''}
          </dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original size</dt>
          <dd data-raw-value={m.originalFileSize}>
            {m.originalFileSize !== undefined ? formatBytes(m.originalFileSize) : ''}
          </dd>
        </div>
      </dl>
    </>
  );
}

export function ImageWatermarkResult({ preset, watermark }: ImageWatermarkResultProps) {
  const isExecuting = watermark.phase === 'running';

  return (
    <aside class={styles.resultPanel} aria-label="Watermark Specs and Results">
      {watermark.error && (
        <InlineAlert tone="danger">{messageFor(preset, watermark.error)}</InlineAlert>
      )}

      {watermark.result ? (
        <ResultCockpit res={watermark.result} watermark={watermark} disabled={isExecuting} />
      ) : (
        <ReadyCockpit watermark={watermark} disabled={isExecuting} />
      )}

      <div class={styles.trustBadge}>
        <span>🔒</span>
        <span>Client-side only • Never leaves device</span>
      </div>

      <HiddenMetricsDl watermark={watermark} />
    </aside>
  );
}
