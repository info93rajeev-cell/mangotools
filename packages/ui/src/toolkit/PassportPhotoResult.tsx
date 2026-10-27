import styles from './passportPhoto.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportPhotoResultProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PassportPhotoResult({ idPrefix: _idPrefix, passport }: PassportPhotoResultProps) {
  const hasFile = !!passport.file;
  const res = passport.result;
  const outW = res ? res.outputWidth : passport.targetWidth;
  const outH = res ? res.outputHeight : passport.targetHeight;
  const isExecuting = passport.phase === 'running';

  return (
    <aside class={styles.resultPanel} aria-label="Passport Output Specs">
      <div class={styles.panelCard}>
        <div class={styles.sectionHeader}>
          <span class={styles.sectionTitle}>5. Output Summary</span>
          <span class={styles.readyBadge}>
            {res ? '✓ Resized' : hasFile ? 'Ready' : 'Awaiting Photo'}
          </span>
        </div>

        <table class={styles.specsTable} aria-label="Passport photo specifications">
          <tbody>
            <tr>
              <td class={styles.specKey}>Resolution</td>
              <td class={styles.specVal}>{hasFile ? `${outW} × ${outH} px` : '—'}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>Format</td>
              <td class={styles.specVal}>{hasFile ? passport.outputFormat.toUpperCase() : '—'}</td>
            </tr>
            <tr>
              <td class={styles.specKey}>Quality</td>
              <td class={styles.specVal}>
                {passport.outputFormat === 'png' ? 'Lossless' : `${passport.quality}%`}
              </td>
            </tr>
            <tr>
              <td class={styles.specKey}>Aspect Ratio</td>
              <td class={styles.specVal}>{passport.keepAspectRatio ? 'Locked' : 'Unlocked'}</td>
            </tr>
            {res && (
              <tr>
                <td class={styles.specKey}>File Size</td>
                <td class={styles.specVal}>{formatBytes(res.outputFileSize)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Warnings */}
        {passport.warnings.length > 0 && (
          <div class={styles.warningList} role="status">
            {passport.warnings.map((w) => (
              <div key={w.code} class={styles.warningItem}>
                <span class={styles.warningIcon}>⚠️</span>
                <span>
                  {(w as { message?: string }).message ||
                    (w.code === 'IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'
                      ? 'Transparent areas will be flattened onto a white background when exporting as JPG.'
                      : w.code)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div class={styles.actionGroup}>
          <button
            type="button"
            class={styles.downloadCtaBtn}
            name="Download passport photo"
            aria-label="Download passport photo"
            onClick={() => void passport.executeResizeAndDownload()}
            disabled={isExecuting}
          >
            <span>📥</span>
            <span>Download passport photo</span>
          </button>
        </div>

        <div class={styles.trustPill}>
          <span>🔒</span>
          <span>100% In-Browser. No Files Uploaded.</span>
        </div>
      </div>

      {/* Playwright E2E Result Locators */}
      {hasFile && (
        <>
          <div data-primary-result="" class="visually-hidden">
            <output>{outW}</output>
          </div>

          <dl class="visually-hidden">
            <div data-output="outputWidth">
              <dt>Photo width</dt>
              <dd>{outW}</dd>
            </div>
            <div data-output="outputHeight">
              <dt>Photo height</dt>
              <dd>{outH}</dd>
            </div>
            <div data-output="outputFormat">
              <dt>Output format</dt>
              <dd>{res ? res.outputFormat : passport.outputFormat}</dd>
            </div>
            {res && (
              <div data-output="outputFileSize">
                <dt>File size</dt>
                <dd>{res.outputFileSize}</dd>
              </div>
            )}
          </dl>
        </>
      )}
    </aside>
  );
}
