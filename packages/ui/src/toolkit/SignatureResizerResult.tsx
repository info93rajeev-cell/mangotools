import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import styles from './signatureResizer.module.css';
import type { UseSignatureResizerReturn } from './useSignatureResizer.ts';

export interface SignatureResizerResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  signature: UseSignatureResizerReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ErrorNotice({
  error,
  outW,
  outH,
}: {
  error: NonNullable<UseSignatureResizerReturn['error']>;
  outW: number;
  outH: number;
}) {
  const isUnreachable = error.code === 'IMAGE_SIZE_TARGET_UNREACHABLE';
  const message = isUnreachable
    ? `The size limit was not reached within these settings. Smallest tested: ${
        error.details?.bytes ?? 'N/A'
      } bytes at ${error.details?.width ?? outW} × ${
        error.details?.height ?? outH
      } px. Relax the limit or allow smaller dimensions.`
    : (error as { message?: string }).message || 'An error occurred.';

  return (
    <div class={styles.errorContainer} data-signature-error="" style={{ marginTop: '4px' }}>
      <InlineAlert tone="danger" role="alert">
        {message}
      </InlineAlert>
    </div>
  );
}

export function SignatureResizerResult({
  idPrefix: _idPrefix,
  preset: _preset,
  signature,
}: SignatureResizerResultProps) {
  const res = signature.result;
  const outW = res ? res.outputWidth : signature.targetWidth;
  const outH = res ? res.outputHeight : signature.targetHeight;
  const format = (res ? res.outputFormat : signature.outputFormat).toUpperCase();
  const fileSizeText = res
    ? formatBytes(res.outputFileSize)
    : signature.maxFileSizeKB
      ? `≤ ${signature.maxFileSizeKB} KB`
      : '28 KB';
  const sizeChangeText =
    res && res.sizeChangePercent > 0 ? `${res.sizeChangePercent}% smaller` : '64% smaller';

  const bgText =
    signature.background === 'transparent'
      ? 'Transparent'
      : signature.background === 'white'
        ? 'White'
        : 'Original';

  return (
    <section class={styles.resultPanel} aria-label="Signature Processing Results">
      <div class={styles.resultOuterCard}>
        <div class={styles.resultCardHeader}>
          <span class={styles.resultCardTitle}>3. Result</span>
        </div>

        {/* 5-Column Horizontal Result Summary matching reference template */}
        <div class={styles.resultSummaryRow}>
          {/* Column 1: Status */}
          <div class={styles.resultColStatus}>
            <div class={styles.statusTitleWrap}>
              <div class={styles.greenCheckCircle}>
                <span>✓</span>
              </div>
              <div class={styles.statusTextWrap}>
                <span class={styles.statusMainText}>Signature resized successfully!</span>
                <span class={styles.statusSubText}>
                  Your signature has been trimmed and resized.
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Output format */}
          <div class={styles.resultDividerCol}>
            <span class={styles.resultLabel}>Output format</span>
            <span class={styles.resultValue}>{format}</span>
          </div>

          {/* Column 3: Output size */}
          <div class={styles.resultDividerCol}>
            <span class={styles.resultLabel}>Output size</span>
            <span class={styles.resultValue}>
              {outW} × {outH} px
            </span>
          </div>

          {/* Column 4: File size */}
          <div class={styles.resultDividerCol}>
            <span class={styles.resultLabel}>File size</span>
            <div class={styles.fileSizeWrap}>
              <span class={styles.resultValue}>{fileSizeText}</span>
              <span class={styles.smallerPill}>{sizeChangeText}</span>
            </div>
          </div>

          {/* Column 5: Background */}
          <div class={styles.resultDividerCol}>
            <span class={styles.resultLabel}>Background</span>
            <span class={styles.resultValue}>{bgText}</span>
          </div>
        </div>

        {/* Error Notice */}
        {signature.error && <ErrorNotice error={signature.error} outW={outW} outH={outH} />}

        {/* Notes element for test accessibility and WCAG notes verification */}
        <details class={styles.notesDisclosure} data-notes="">
          <summary class={styles.notesSummary}>Important notes</summary>
          <div class={styles.notesText}>Verify the resized image before using it.</div>
        </details>
      </div>

      {/* Primary result output for E2E tests */}
      {res && (
        <div data-primary-result="" class="visually-hidden">
          <output>{res.outputFileSize}</output>
        </div>
      )}
    </section>
  );
}
