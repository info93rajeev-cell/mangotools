import type { ResolvedPreset } from '@mangotools/schemas';
import { InlineAlert } from '../primitives/feedback.tsx';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import { BINARY_SIZE_NOTE, formatImageBytes } from './imageSizeFormat.ts';
import styles from './signatureResizer.module.css';
import type { UseSignatureResizerReturn } from './useSignatureResizer.ts';

export interface SignatureResizerResultProps {
  idPrefix: string;
  preset: ResolvedPreset;
  signature: UseSignatureResizerReturn;
}

const formatBytes = formatImageBytes;

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
    : resolveImageErrorMessage(error);

  return (
    <div class={styles.errorContainer} data-signature-error="" style={{ marginTop: '4px' }}>
      <InlineAlert tone="danger" role="alert">
        {message}
      </InlineAlert>
    </div>
  );
}

function SignatureSummaryRow({
  signature,
  res,
}: {
  signature: UseSignatureResizerReturn;
  res: NonNullable<UseSignatureResizerReturn['result']>;
}) {
  const format = res.outputFormat.toUpperCase();
  const fileSizeText = formatBytes(res.outputFileSize);
  const sizeChangeText = res.sizeChangePercent > 0 ? `${res.sizeChangePercent}% smaller` : '';
  const bgText =
    signature.background === 'transparent'
      ? 'Transparent'
      : signature.background === 'white'
        ? 'White'
        : 'Original';

  return (
    <div class={styles.resultSummaryRow}>
      <div class={styles.resultColStatus}>
        <div class={styles.statusTitleWrap}>
          <div class={styles.greenCheckCircle}>
            <span>✓</span>
          </div>
          <div class={styles.statusTextWrap}>
            <span class={styles.statusMainText}>Signature resized successfully!</span>
            <span class={styles.statusSubText}>Your signature has been trimmed and resized.</span>
          </div>
        </div>
      </div>

      <div class={styles.resultDividerCol}>
        <span class={styles.resultLabel}>Output format</span>
        <span class={styles.resultValue}>{format}</span>
      </div>

      <div class={styles.resultDividerCol}>
        <span class={styles.resultLabel}>Output size</span>
        <span class={styles.resultValue}>
          {res.outputWidth} × {res.outputHeight} px
        </span>
      </div>

      <div class={styles.resultDividerCol}>
        <span class={styles.resultLabel}>File size</span>
        <div class={styles.fileSizeWrap}>
          <span class={styles.resultValue} title={BINARY_SIZE_NOTE}>
            {fileSizeText}
          </span>
          {sizeChangeText && <span class={styles.smallerPill}>{sizeChangeText}</span>}
        </div>
      </div>

      <div class={styles.resultDividerCol}>
        <span class={styles.resultLabel}>Background</span>
        <span class={styles.resultValue}>{bgText}</span>
      </div>
    </div>
  );
}

export function SignatureResizerResult({
  idPrefix: _idPrefix,
  preset: _preset,
  signature,
}: SignatureResizerResultProps) {
  const res = signature.result;
  const isError = Boolean(signature.error);
  const outW = res ? res.outputWidth : signature.file ? signature.targetWidth : 0;
  const outH = res ? res.outputHeight : signature.file ? signature.targetHeight : 0;

  return (
    <section class={styles.resultPanel} aria-label="Signature Processing Results">
      <div class={styles.resultOuterCard}>
        <div class={styles.resultCardHeader}>
          <span class={styles.resultCardTitle}>3. Result</span>
        </div>

        {/* Error Notice */}
        {signature.error && <ErrorNotice error={signature.error} outW={outW} outH={outH} />}

        {/* 5-Column Horizontal Result Summary matching reference template */}
        {!isError && res && <SignatureSummaryRow signature={signature} res={res} />}

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
