import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import { formatImageBytes } from './imageSizeFormat.ts';
import styles from './imageWatermark.module.css';
import type { UseImageWatermarkReturn, WatermarkResultData } from './useImageWatermark.ts';

export interface ImageWatermarkResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  watermark: UseImageWatermarkReturn;
}

function getOriginalFormat(fileName?: string): string {
  if (fileName?.toLowerCase().endsWith('.png')) return 'png';
  if (fileName?.toLowerCase().endsWith('.webp')) return 'webp';
  return 'jpg';
}

function getDisplayFormat(
  resFormat?: string,
  outputFormat?: string,
  originalFormat = 'jpg',
): string {
  if (resFormat) return resFormat;
  return outputFormat === 'same' ? originalFormat : (outputFormat ?? 'jpg');
}

interface ContractDlProps {
  res: WatermarkResultData | null;
  watermark: UseImageWatermarkReturn;
  displayFmt: string;
  originalFmt: string;
  dims: { width: number; height: number };
}

function ContractDl({ res, watermark, displayFmt, originalFmt, dims }: ContractDlProps) {
  const w = res ? res.outputWidth : dims.width;
  const h = res ? res.outputHeight : dims.height;

  return (
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
        <dd>{w}</dd>
      </div>
      <div data-output="outputHeight">
        <dt>Height (px)</dt>
        <dd>{h}</dd>
      </div>
      <div data-output="originalWidth">
        <dt>Original width (px)</dt>
        <dd>{res ? res.originalWidth : w}</dd>
      </div>
      <div data-output="originalHeight">
        <dt>Original height (px)</dt>
        <dd>{res ? res.originalHeight : h}</dd>
      </div>
      <div data-output="outputFileSize">
        <dt>Output file size (bytes)</dt>
        <dd>{res ? res.outputFileSize : ''}</dd>
      </div>
    </dl>
  );
}

export function ImageWatermarkResult({
  idPrefix: _idPrefix,
  preset: _preset,
  watermark,
}: ImageWatermarkResultProps) {
  const res = watermark.result;
  const originalFmt = getOriginalFormat(watermark.file?.name);
  const displayFmt = getDisplayFormat(res?.outputFormat, watermark.outputFormat, originalFmt);

  const dims = res
    ? { width: res.outputWidth, height: res.outputHeight }
    : watermark.sourceDims.width > 0
      ? watermark.sourceDims
      : { width: 4000, height: 2667 };

  const outBytes = res ? res.outputFileSize : 1468006; // 1.4 MB
  const textDisplay = res ? res.watermarkText : watermark.text.trim() || 'BeyondTheAI';

  const baseName = watermark.file?.name.replace(/\.[^/.]+$/, '') ?? 'mountain-lake';
  const defaultWatermarkedName = `${baseName}-watermarked.${displayFmt.toLowerCase()}`;

  return (
    <div class={styles.verificationCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>4. Result summary</span>
      </div>

      <div class={styles.verifMetricsRow}>
        <div class={styles.verifBannerBox}>
          <span class={styles.verifBannerIcon}>✓</span>
          <div class={styles.verifBannerText}>
            <div class={styles.verifBannerTitle}>Image watermarked successfully!</div>
            <div class={styles.verifBannerSub}>Your image is ready to download.</div>
          </div>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Output format</span>
          <span class={styles.metricVal}>{displayFmt.toUpperCase()}</span>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Output size</span>
          <div class={styles.sizeValRow}>
            <span class={styles.metricVal}>{formatImageBytes(outBytes)}</span>
            <span class={styles.reductionBadge}>+8% larger</span>
          </div>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Dimensions</span>
          <span class={styles.metricVal}>
            {dims.width} &times; {dims.height} px
          </span>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Watermark text</span>
          <span class={styles.metricVal} title={textDisplay}>
            {textDisplay}
          </span>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Opacity</span>
          <span class={styles.metricVal}>{res ? res.opacity : watermark.opacity}%</span>
        </div>
      </div>

      <div class="visually-hidden" data-primary-result="">
        <output>{res ? res.fileName : defaultWatermarkedName}</output>
      </div>

      {watermark.error && (
        <div class={styles.errorContainer} data-error="">
          <InlineAlert tone="danger" role="alert">
            {resolveImageErrorMessage(
              watermark.error,
              watermark.file?.name ?? watermark.invalidFile?.name,
            )}
          </InlineAlert>
        </div>
      )}

      <ContractDl
        res={res}
        watermark={watermark}
        displayFmt={displayFmt}
        originalFmt={originalFmt}
        dims={dims}
      />
    </div>
  );
}
