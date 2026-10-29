import { useState } from 'preact/hooks';
import styles from './passportPhoto.module.css';
import enhanceStyles from './passportResult.module.css';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportPhotoResultProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
  enhance?: UsePassportEnhanceStateReturn;
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

  const presetName =
    passport.activePresetId === 'in'
      ? 'India'
      : passport.activePresetId === 'us'
        ? 'US'
        : passport.activePresetId === 'eu'
          ? 'Schengen / Europe'
          : 'Passport';

  return (
    <table class={styles.specsTable} aria-label="Passport photo specifications">
      <tbody>
        <tr>
          <td class={styles.specKey}>Resolution</td>
          <td class={styles.specVal}>{hasFile ? `${outW} × ${outH} px` : '413 × 531 px'}</td>
        </tr>
        <tr>
          <td class={styles.specKey}>Physical Size ({presetName})</td>
          <td class={styles.specVal}>
            {hasFile
              ? `${sheetLayout.photoWidthMm} × ${sheetLayout.photoHeightMm} mm`
              : '35 × 45 mm'}
          </td>
        </tr>
        <tr>
          <td class={styles.specKey}>Format</td>
          <td class={styles.specVal}>{hasFile ? passport.outputFormat.toUpperCase() : 'JPG'}</td>
        </tr>
        <tr>
          <td class={styles.specKey}>File Size (estimated)</td>
          <td class={styles.specVal}>{res ? formatBytes(res.outputFileSize) : '~ 120 KB'}</td>
        </tr>
        <tr>
          <td class={styles.specKey}>Quality</td>
          <td class={styles.specVal}>
            {passport.outputFormat === 'png' ? 'Lossless' : `${passport.quality}%`}
          </td>
        </tr>
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

export function PassportPhotoResult({
  idPrefix: _idPrefix,
  passport,
  enhance,
}: PassportPhotoResultProps) {
  const [resultTab, setResultTab] = useState<'final' | 'compare'>('final');
  const hasFile = !!passport.file;
  const res = passport.result;
  const outW = res ? res.outputWidth : passport.targetWidth || 413;
  const outH = res ? res.outputHeight : passport.targetHeight || 531;
  const isExecuting = passport.phase === 'running';

  const previewImageSrc =
    enhance?.enhancedBlobUrl ||
    passport.resultUrl ||
    passport.imageSrc ||
    '/samples/passport-portrait.jpg';

  const copyToClipboard = async () => {
    try {
      if (previewImageSrc) {
        const response = await fetch(previewImageSrc);
        const blob = await response.blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <aside class={styles.resultPanel} aria-label="Passport Output Specs">
      <div class={styles.panelCard}>
        {/* HEADER */}
        <div class={styles.sectionHeader}>
          <div class={enhanceStyles.headerStepBadgeRow}>
            <span class={enhanceStyles.stepBadgeGreen}>7</span>
            <span class={styles.sectionTitle}>Output Preview & Summary</span>
          </div>
        </div>

        {/* TOP TABS: FINAL PHOTO vs COMPARE */}
        <div class={enhanceStyles.outputViewTabs}>
          <button
            type="button"
            class={`${enhanceStyles.outputViewTabBtn} ${
              resultTab === 'final' ? enhanceStyles.outputTabActive : ''
            }`}
            onClick={() => setResultTab('final')}
          >
            Final Photo
          </button>
          <button
            type="button"
            class={`${enhanceStyles.outputViewTabBtn} ${
              resultTab === 'compare' ? enhanceStyles.outputTabActive : ''
            }`}
            onClick={() => setResultTab('compare')}
          >
            ◰ Compare
          </button>
        </div>

        {/* CROPPED PHOTO PREVIEW BOX WITH DIMENSION ARROWS */}
        <div class={enhanceStyles.finalPhotoPreviewBox}>
          {/* Top dimension arrow */}
          <div class={enhanceStyles.dimArrowTop}>
            <span class={enhanceStyles.dimArrowLine} />
            <span class={enhanceStyles.dimBadgeText}>{outW} px</span>
            <span class={enhanceStyles.dimArrowLine} />
          </div>

          <div class={enhanceStyles.photoWithSideArrow}>
            <div class={enhanceStyles.photoFrame}>
              <img
                src={previewImageSrc}
                alt="Passport Final Preview"
                class={enhanceStyles.finalPreviewImg}
              />
            </div>
            {/* Right dimension arrow */}
            <div class={enhanceStyles.dimArrowRight}>
              <span class={enhanceStyles.dimArrowLineVert} />
              <span class={enhanceStyles.dimBadgeTextVert}>{outH} px</span>
              <span class={enhanceStyles.dimArrowLineVert} />
            </div>
          </div>
        </div>

        {/* SPECIFICATIONS TABLE */}
        <SpecsTable passport={passport} outW={outW} outH={outH} />

        {/* READY STATUS BADGE */}
        <div class={enhanceStyles.readyStatusBadge}>
          <span class={enhanceStyles.greenCheckCircle}>✓</span>
          <div class={enhanceStyles.readyTextGroup}>
            <span class={enhanceStyles.readyTitle}>Ready for download</span>
            <span class={enhanceStyles.readySubtitle}>
              Matches {passport.activePresetId === 'in' ? 'India' : 'official'} passport photo
              requirements.
            </span>
          </div>
        </div>

        {/* PRIMARY DOWNLOAD PHOTO CTA */}
        <div class={styles.actionGroup}>
          <button
            type="button"
            class={enhanceStyles.downloadAmberBtn}
            name="Download passport photo"
            aria-label="Download passport photo"
            onClick={() => void passport.executeResizeAndDownload()}
            disabled={isExecuting || !hasFile}
          >
            <span class={styles.btnIcon}>📥</span>
            <span class={styles.btnText}>Download Photo</span>
            <span class={enhanceStyles.btnArrow}>▼</span>
          </button>

          {/* SECONDARY ACTION PILLS */}
          <div class={enhanceStyles.secondaryPillsRow}>
            <button
              type="button"
              class={enhanceStyles.secondaryPillBtn}
              onClick={() => {
                passport.setOutputFormat('webp');
                void passport.executeResizeAndDownload();
              }}
              disabled={isExecuting || !hasFile}
            >
              Download WebP
            </button>

            <button
              type="button"
              class={enhanceStyles.secondaryPillBtn}
              onClick={() => void copyToClipboard()}
              disabled={isExecuting || !hasFile}
            >
              📋 Copy Image
            </button>
          </div>
        </div>

        {/* TIPS FOR BEST RESULTS CARD */}
        <div class={enhanceStyles.tipsCard}>
          <div class={enhanceStyles.tipsHeader}>
            <span>💡</span>
            <span class={enhanceStyles.tipsTitle}>Tips for best results</span>
          </div>
          <ul class={enhanceStyles.tipsList}>
            <li>
              <span class={enhanceStyles.tipCheck}>✓</span>
              <span>Use good lighting and plain background</span>
            </li>
            <li>
              <span class={enhanceStyles.tipCheck}>✓</span>
              <span>Keep a neutral facial expression</span>
            </li>
            <li>
              <span class={enhanceStyles.tipCheck}>✓</span>
              <span>Use subtle filters only (do not over-edit)</span>
            </li>
            <li>
              <span class={enhanceStyles.tipCheck}>✓</span>
              <span>Final image should look like you</span>
            </li>
            <li>
              <span class={enhanceStyles.tipCheck}>✓</span>
              <span>Check official guidelines for your application</span>
            </li>
          </ul>
        </div>
      </div>

      <E2eLocators passport={passport} outW={outW} outH={outH} />
    </aside>
  );
}
