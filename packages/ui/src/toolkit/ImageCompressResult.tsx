import type { OpError } from '@mangotools/core';
import type { ResolvedPreset } from '@mangotools/schemas';
import { formatFileSize } from '../archetypes/FileQueue.tsx';
import type { FileToolResult } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { t } from '../strings/en.ts';
import styles from './imageCompress.module.css';
import { label, messageFor } from './presentation.ts';
import { NoteList } from './ResultNotices.tsx';

export interface ImageCompressResultProps {
  preset: ResolvedPreset;
  result: FileToolResult | null;
  error: OpError | null;
  onDownload: () => void;
  onClear: () => void;
}

export function ImageCompressResult({
  preset,
  result,
  error,
  onDownload,
  onClear,
}: ImageCompressResultProps) {
  if (error) {
    const isNotSmaller = error.code === 'IMAGE_COMPRESSION_NOT_SMALLER';
    return (
      <section class={styles.resultSection} aria-label="Compression result" data-compress-error="">
        <div class={styles.stepHeader}>
          <div class={styles.stepTitleGroup}>
            <span class={styles.stepBadge}>3</span>
            <h3 class={styles.stepTitle}>Compression result</h3>
          </div>
        </div>
        <InlineAlert tone="danger" role="alert">
          {isNotSmaller
            ? 'No smaller result was achieved without degrading quality below 50%.'
            : messageFor(preset, error)}
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
      </section>
    );
  }

  if (!result) return null;

  const originalBytes = Number(result.originalFileSize ?? 0);
  const compressedBytes = Number(result.outputFileSize ?? 0);
  const percentText = `${result.sizeChangePercent}%`;

  return (
    <section class={styles.resultSection} aria-label="Compression result" data-compress-result="">
      <div class={styles.stepHeader}>
        <div class={styles.stepTitleGroup}>
          <span class={styles.stepBadge}>3</span>
          <h3 class={styles.stepTitle}>Compression result</h3>
        </div>
      </div>

      <div class={styles.heroBanner}>
        <div class={styles.heroLeft}>
          <span class={styles.checkCircle} aria-hidden="true">
            ✓
          </span>
          <div class={styles.heroTitleGroup}>
            <div class={styles.heroTitle}>Image compressed successfully!</div>
            <div class={styles.heroSub}>
              The compressed image is {percentText} smaller than the original with no noticeable
              loss.
            </div>
          </div>
        </div>

        <div class={styles.metricsRow}>
          <div class={styles.metricBadge}>
            <span class={styles.metricLabel}>Original size</span>
            <div class={styles.metricValue}>{formatFileSize(originalBytes)}</div>
          </div>
          <div class={styles.metricBadge}>
            <span class={styles.metricLabel}>Compressed size</span>
            <div class={styles.metricValueSaved}>{formatFileSize(compressedBytes)}</div>
          </div>
          <div class={styles.metricBadge}>
            <span class={styles.metricLabel}>Size reduction</span>
            <span class={styles.reductionPill}>{percentText} smaller</span>
          </div>
        </div>
      </div>

      <div data-primary-result="" class="sr-only">
        <output>{percentText}</output>
      </div>

      <dl class="sr-only">
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{String(result.outputFormat ?? '')}</dd>
        </div>
        <div data-output="sizeDifferenceBytes">
          <dt>Amount saved</dt>
          <dd data-raw-value={String(result.sizeDifferenceBytes ?? 0)}>
            {formatFileSize(Number(result.sizeDifferenceBytes ?? 0))}
          </dd>
        </div>
        <div data-output="outputFileSize">
          <dt>Compressed size</dt>
          <dd data-raw-value={String(compressedBytes)}>{formatFileSize(compressedBytes)}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original size</dt>
          <dd data-raw-value={String(originalBytes)}>{formatFileSize(originalBytes)}</dd>
        </div>
        <div data-output="sizeChangePercent">
          <dt>Size reduction</dt>
          <dd data-raw-value={String(result.sizeChangePercent ?? 0)}>{percentText}</dd>
        </div>
        <div data-output="dimensions">
          <dt>Dimensions</dt>
          <dd>{String(result.dimensions ?? '')}</dd>
        </div>
        <div data-output="fileName">
          <dt>Output file</dt>
          <dd>{String(result.fileName ?? '')}</dd>
        </div>
      </dl>

      <div class={styles.honestCallout}>
        <strong class={styles.honestTitle}>Honest results:</strong>
        <span class={styles.honestText}>
          If we cannot make the file smaller without dropping below the minimum acceptable quality,
          we tell you immediately rather than re-encoding with bloated file sizes.
        </span>
      </div>

      <div class={styles.resultActions}>
        <Button variant="primary" icon="download" onClick={onDownload}>
          {label(preset, 'fileTool.downloadCta')}
        </Button>
        <Button variant="ghost" icon="x" onClick={onClear}>
          {t('fileTool.clearAll')}
        </Button>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <NoteList preset={preset} notices={result.warnings} />
      )}
    </section>
  );
}
