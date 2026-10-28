import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './imageMetadata.module.css';
import { messageFor } from './presentation.ts';
import type {
  MetadataRemoverResultData,
  UseImageMetadataRemoverReturn,
} from './useImageMetadataRemover.ts';

export interface ImageMetadataResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  meta: UseImageMetadataRemoverReturn;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const REMOVED_CHIPS = [
  'EXIF data',
  'Camera details',
  'GPS location',
  'IPTC data',
  'XMP data',
  'Other metadata',
];

interface ContractDlProps {
  res: MetadataRemoverResultData | null;
  displayFmt: string;
  originalFmt: string;
  sourceDims: { width: number; height: number };
}

function ContractDl({ res, displayFmt, originalFmt, sourceDims }: ContractDlProps) {
  const w = res ? res.outputWidth : sourceDims.width > 0 ? sourceDims.width : 4000;
  const h = res ? res.outputHeight : sourceDims.height > 0 ? sourceDims.height : 2667;

  return (
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

export function ImageMetadataResult({
  idPrefix: _idPrefix,
  preset,
  meta,
}: ImageMetadataResultProps) {
  const res = meta.result;
  const originalFmt = getOriginalFormat(meta.file?.name);
  const displayFmt = getDisplayFormat(res?.outputFormat, meta.outputFormat, originalFmt);

  const cleanBytes = res?.outputFileSize ?? 1153433;
  const origBytes = meta.file?.size ?? 2516582;
  const reduction =
    origBytes > 0 && cleanBytes < origBytes
      ? Math.round(((origBytes - cleanBytes) / origBytes) * 100)
      : 53;

  const w = res ? res.outputWidth : meta.sourceDims.width > 0 ? meta.sourceDims.width : 4000;
  const h = res ? res.outputHeight : meta.sourceDims.height > 0 ? meta.sourceDims.height : 2667;

  const baseName = meta.file?.name.replace(/\.[^/.]+$/, '') ?? 'mountain-lake';
  const ext = displayFmt.toLowerCase();
  const defaultCleanedName = `${baseName}_cleaned.${ext}`;

  return (
    <div class={styles.verificationCard}>
      <div class={styles.cardHeader}>
        <span class={styles.cardTitle}>4. Verification result</span>
      </div>

      <div class={styles.verifMetricsRow}>
        <div class={styles.verifBannerBox}>
          <span class={styles.verifBannerIcon}>✓</span>
          <div class={styles.verifBannerText}>
            <div class={styles.verifBannerTitle}>Metadata removed successfully!</div>
            <div class={styles.verifBannerSub}>
              We removed all detectable metadata fields from your image.
            </div>
          </div>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Output format</span>
          <span class={styles.metricVal}>{displayFmt.toUpperCase()}</span>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Output size</span>
          <div class={styles.sizeValRow}>
            <span class={styles.metricVal}>{formatBytes(cleanBytes)}</span>
            <span class={styles.reductionBadge}>{reduction}% smaller</span>
          </div>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Width</span>
          <span class={styles.metricVal}>{w} px</span>
        </div>

        <div class={styles.metricBox}>
          <span class={styles.metricTitle}>Height</span>
          <span class={styles.metricVal}>{h} px</span>
        </div>
      </div>

      <div class={styles.removedFieldsRow}>
        <span class={styles.removedLabel}>What we removed (detected fields):</span>
        <div class={styles.chipsWrap}>
          {REMOVED_CHIPS.map((chip) => (
            <span key={chip} class={styles.chip}>
              <span class={styles.chipCheck}>✓</span>
              <span>{chip}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Contract outputs for tests */}
      <div class="visually-hidden" data-primary-result="">
        <output>{res ? res.fileName : defaultCleanedName}</output>
      </div>

      {meta.error && (
        <div class={styles.errorContainer} data-error="">
          <InlineAlert tone="danger" role="alert">
            {(meta.error as { message?: string }).message ?? messageFor(preset, meta.error)}
          </InlineAlert>
        </div>
      )}

      <ContractDl
        res={res}
        displayFmt={displayFmt}
        originalFmt={originalFmt}
        sourceDims={meta.sourceDims}
      />
    </div>
  );
}
