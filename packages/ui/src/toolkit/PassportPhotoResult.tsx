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

interface SpecsTableProps {
  passport: UsePassportPhotoReturn;
  outW: number;
  outH: number;
}

function SpecsTable({ passport, outW, outH }: SpecsTableProps) {
  const hasFile = !!passport.file;
  const res = passport.result;
  const { sheetLayout } = passport;

  return (
    <table class={styles.specsTable} aria-label="Passport photo specifications">
      <tbody>
        <tr>
          <td class={styles.specKey}>Resolution</td>
          <td class={styles.specVal}>{hasFile ? `${outW} × ${outH} px` : '—'}</td>
        </tr>
        <tr>
          <td class={styles.specKey}>Print Size</td>
          <td class={styles.specVal}>
            {hasFile ? `${sheetLayout.photoWidthMm} × ${sheetLayout.photoHeightMm} mm` : '—'}
          </td>
        </tr>
        <tr>
          <td class={styles.specKey}>Sheet Paper</td>
          <td class={styles.specVal}>{sheetLayout.paper.name}</td>
        </tr>
        <tr>
          <td class={styles.specKey}>Sheet Layout</td>
          <td class={styles.specVal}>
            {sheetLayout.photoCount} photos ({sheetLayout.blankPercent}% blank)
          </td>
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
        {res && (
          <tr>
            <td class={styles.specKey}>File Size</td>
            <td class={styles.specVal}>{formatBytes(res.outputFileSize)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function E2eLocators({
  passport,
  outW,
  outH,
}: {
  passport: UsePassportPhotoReturn;
  outW: number;
  outH: number;
}) {
  const res = passport.result;
  if (!passport.file) return null;

  return (
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
  );
}

export function PassportPhotoResult({ idPrefix: _idPrefix, passport }: PassportPhotoResultProps) {
  const hasFile = !!passport.file;
  const res = passport.result;
  const outW = res ? res.outputWidth : passport.targetWidth;
  const outH = res ? res.outputHeight : passport.targetHeight;
  const isExecuting = passport.phase === 'running';
  const { sheetLayout, isGeneratingSheet, printSheet, downloadSheet } = passport;

  return (
    <aside class={styles.resultPanel} aria-label="Passport Output Specs">
      <div class={styles.panelCard}>
        <div class={styles.sectionHeader}>
          <span class={styles.sectionTitle}>6. Output Summary</span>
          <span class={styles.readyBadge}>
            {res ? '✓ Resized' : hasFile ? 'Ready' : 'Awaiting Photo'}
          </span>
        </div>

        <SpecsTable passport={passport} outW={outW} outH={outH} />

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
          {/* PRIMARY: Single Passport Photo */}
          <button
            type="button"
            class={styles.downloadCtaBtn}
            name="Download passport photo"
            aria-label="Download passport photo"
            onClick={() => void passport.executeResizeAndDownload()}
            disabled={isExecuting || !hasFile}
          >
            <span>📥</span>
            <span>Download passport photo</span>
          </button>

          {/* SECONDARY: Direct Print Sheet */}
          <button
            type="button"
            class={styles.printSheetBtn}
            onClick={() => void printSheet()}
            disabled={isExecuting || isGeneratingSheet || !hasFile}
            title="Open browser print dialog with 1:1 scale for studio printing"
          >
            <span>🖨️</span>
            <span>Print Sheet ({sheetLayout.photoCount} photos)</span>
          </button>

          {/* TERTIARY: Download Print Sheet */}
          <button
            type="button"
            class={styles.downloadSheetSecondaryBtn}
            onClick={() => void downloadSheet()}
            disabled={isExecuting || isGeneratingSheet || !hasFile}
            title="Download high-resolution 300 DPI sheet image for printing later"
          >
            <span>📄</span>
            <span>Download Sheet (JPG)</span>
          </button>
        </div>

        <div class={styles.trustPill}>
          <span>🔒</span>
          <span>100% In-Browser. No Files Uploaded.</span>
        </div>
      </div>

      <E2eLocators passport={passport} outW={outW} outH={outH} />
    </aside>
  );
}
