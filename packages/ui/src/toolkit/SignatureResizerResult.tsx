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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SignatureResizerResult({
  idPrefix: _idPrefix,
  preset: _preset,
  signature,
}: SignatureResizerResultProps) {
  const hasFile = !!signature.file;
  const res = signature.result;
  const isExecuting = signature.phase === 'running';

  const outW = res ? res.outputWidth : signature.targetWidth;
  const outH = res ? res.outputHeight : signature.targetHeight;

  const isUnreachable = signature.error?.code === 'IMAGE_SIZE_TARGET_UNREACHABLE';

  return (
    <aside class={styles.resultPanel} aria-label="Signature Output Specs and Download">
      <div class={styles.panelCard}>
        <div class={styles.sectionHeader}>
          <span class={styles.sectionTitle}>5. Output Cockpit</span>
          <span class={styles.readyBadge}>
            {res ? '✓ Resized' : hasFile ? 'Ready' : 'Awaiting Image'}
          </span>
        </div>

        {/* Primary result byte count for contract verification */}
        {res && (
          <div class={styles.primaryResultCockpit} data-primary-result="">
            <span class={styles.primaryLabel}>Output size (bytes)</span>
            <output class={styles.primaryValue}>{res.outputFileSize}</output>
          </div>
        )}

        {/* Specifications Table */}
        <table class={styles.specsTable} aria-label="Signature specifications">
          <tbody>
            <tr>
              <td class={styles.specKey}>Target Canvas</td>
              <td class={styles.specVal}>
                {outW} × {outH} px
              </td>
            </tr>
            <tr>
              <td class={styles.specKey}>Output Format</td>
              <td class={styles.specVal}>{signature.outputFormat.toUpperCase()}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>Max Target Limit</td>
              <td class={styles.specVal}>
                {signature.maxFileSizeKB ? `≤ ${signature.maxFileSizeKB} KB` : 'None (Unlimited)'}
              </td>
            </tr>
            <tr>
              <td class={styles.specKey}>Content Alignment</td>
              <td class={styles.specVal}>Centered + Padded</td>
            </tr>
            {res && (
              <tr>
                <td class={styles.specKey}>Actual File Size</td>
                <td class={styles.specVal} style={{ fontWeight: 'var(--weight-bold)' }}>
                  {formatBytes(res.outputFileSize)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Error Alert */}
        {signature.error && (
          <div class={styles.errorContainer} data-signature-error="">
            <InlineAlert tone="danger" role="alert">
              {isUnreachable
                ? `The size limit was not reached within these settings. Smallest tested: ${
                    signature.error.details?.bytes ?? 'N/A'
                  } bytes at ${signature.error.details?.width ?? outW} × ${
                    signature.error.details?.height ?? outH
                  } px (${
                    signature.error.details?.attempts ?? 8
                  } attempts). No file was downloaded. Relax the limit or allow smaller dimensions.`
                : signature.error.message || 'An error occurred.'}
            </InlineAlert>
          </div>
        )}

        {/* Important Notes Disclosure (Required by E2E test) */}
        <details class={styles.notesDisclosure} data-notes="">
          <summary class={styles.notesSummary}>Important notes</summary>
          <ul class={styles.notesList}>
            <li>Verify the resized image before using it.</li>
            {signature.outputFormat === 'jpg' && (
              <li>
                Transparent areas will be flattened onto a white background when exporting as JPG.
              </li>
            )}
            <li>Metadata such as camera and location data is not preserved.</li>
          </ul>
        </details>

        {/* Primary Action Button */}
        <div class={styles.actionGroup}>
          <button
            type="button"
            class={styles.primaryActionBtn}
            data-action="download-signature"
            onClick={() => void signature.executeResizeAndDownload()}
            disabled={isExecuting}
          >
            <span>⬇️</span>
            <span>{isExecuting ? 'Processing...' : 'Download signature'}</span>
          </button>
        </div>
      </div>

      {/* Hidden DL outputs for strict contract compatibility */}
      <dl class="visually-hidden">
        <div data-output="outputFileSize">
          <dt>Output size (bytes)</dt>
          <dd>{res ? res.outputFileSize : ''}</dd>
        </div>
        <div data-output="outputWidth">
          <dt>Output width (px)</dt>
          <dd>{res ? res.outputWidth : signature.targetWidth}</dd>
        </div>
        <div data-output="outputHeight">
          <dt>Output height (px)</dt>
          <dd>{res ? res.outputHeight : signature.targetHeight}</dd>
        </div>
        <div data-output="outputFormat">
          <dt>Output format</dt>
          <dd>{res ? res.outputFormat : signature.outputFormat}</dd>
        </div>
        <div data-output="originalFileSize">
          <dt>Original size (bytes)</dt>
          <dd>{res ? res.originalFileSize : (signature.file?.size ?? '')}</dd>
        </div>
        <div data-output="fileName">
          <dt>Output file</dt>
          <dd>{res ? res.fileName : ''}</dd>
        </div>
      </dl>
    </aside>
  );
}
