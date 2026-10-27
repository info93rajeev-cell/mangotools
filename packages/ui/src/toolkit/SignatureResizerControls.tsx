import type { ResolvedPreset } from '@mangotools/schemas';
import styles from './signatureResizer.module.css';
import {
  SIGNATURE_PRESETS,
  type SignatureBackground,
  type SignatureOutputFormat,
  type SignaturePresetItem,
  type UseSignatureResizerReturn,
} from './useSignatureResizer.ts';

export interface SignatureResizerControlsProps {
  idPrefix: string;
  preset: ResolvedPreset;
  signature: UseSignatureResizerReturn;
  onSelectFile?: (file: File) => void;
  onTrySample: () => void;
}

function DocFileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      class={styles.formatDocIcon}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="13" r="1.5" />
      <path d="m18 17-3.5-3.5-5 5" />
    </svg>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio controls layout
export function SignatureResizerControls({
  idPrefix,
  preset: _preset,
  signature,
  onTrySample,
}: SignatureResizerControlsProps) {
  const isExecuting = signature.phase === 'running';

  return (
    <aside class={styles.controlPanel} aria-label="Signature Controls">
      <div class={styles.panelCard}>
        {/* Header */}
        <div class={styles.cardHeader}>
          <span class={styles.cardTitle}>2. Resize settings</span>
          <div class={styles.headerActions}>
            <button
              type="button"
              class={styles.miniGhostBtn}
              onClick={onTrySample}
              disabled={isExecuting}
              title="Load sample signature"
            >
              ✨ Sample
            </button>
            <button
              type="button"
              class={styles.miniGhostBtn}
              onClick={signature.clearAll}
              disabled={isExecuting}
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Target Dimensions */}
        <div class={styles.dimensionsRow}>
          <div class={styles.dimInputGroup}>
            <label for={`${idPrefix}-width`} class={styles.inputLabel}>
              Target width
            </label>
            <div class={styles.inputWithUnit}>
              <input
                id={`${idPrefix}-width`}
                type="number"
                min="1"
                max="20000"
                class={styles.dimInput}
                aria-label="Signature width"
                value={signature.targetWidth > 0 ? String(signature.targetWidth) : ''}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  signature.setTargetWidth(val ? Number(val) : 0);
                }}
              />
              <span class={styles.unitBadge}>px</span>
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            class={`${styles.lockAspectBtn} ${signature.keepAspectRatio ? styles.lockActive : ''}`}
            onClick={() => signature.setKeepAspectRatio(!signature.keepAspectRatio)}
            title={signature.keepAspectRatio ? 'Lock aspect ratio (active)' : 'Unlock aspect ratio'}
            aria-label="Toggle aspect ratio lock"
          >
            🔗
          </button>

          <div class={styles.dimInputGroup}>
            <label for={`${idPrefix}-height`} class={styles.inputLabel}>
              Target height
            </label>
            <div class={styles.inputWithUnit}>
              <input
                id={`${idPrefix}-height`}
                type="number"
                min="1"
                max="20000"
                class={styles.dimInput}
                aria-label="Signature height"
                value={signature.targetHeight > 0 ? String(signature.targetHeight) : ''}
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value.trim();
                  signature.setTargetHeight(val ? Number(val) : 0);
                }}
              />
              <span class={styles.unitBadge}>px</span>
            </div>
          </div>
        </div>

        {/* Info callout */}
        <div class={styles.infoCallout}>
          <span class={styles.infoIcon}>ℹ</span>
          <span>
            The tool automatically trims surrounding blank space and fits the signature neatly
            within the specified size, with controlled padding.
          </span>
        </div>

        {/* Presets Row */}
        <div class={styles.presetsRow}>
          {SIGNATURE_PRESETS.map((p: SignaturePresetItem) => {
            const isActive =
              signature.targetWidth === p.width &&
              signature.targetHeight === p.height &&
              (p.maxKB === undefined || signature.maxFileSizeKB === p.maxKB);
            return (
              <button
                key={p.id}
                type="button"
                class={`${styles.presetPill} ${isActive ? styles.presetPillActive : ''}`}
                onClick={() => signature.applyPreset(p)}
                title={p.hint}
              >
                <span>{p.label}</span>
                <span class={styles.presetDims}>
                  {p.width}×{p.height}
                </span>
              </button>
            );
          })}
        </div>

        {/* Output format section */}
        <div class={styles.formatSection}>
          <label for={`${idPrefix}-format`} class={styles.inputLabel}>
            Output format
          </label>

          {/* Hidden native select for Playwright test compatibility */}
          <select
            id={`${idPrefix}-format`}
            aria-label="Output format"
            class={styles.visuallyHiddenSelect}
            value={signature.outputFormat}
            onChange={(e) =>
              signature.setOutputFormat(
                (e.target as HTMLSelectElement).value as SignatureOutputFormat,
              )
            }
          >
            <option value="png">PNG (retain transparency)</option>
            <option value="jpg">JPG (white background)</option>
            <option value="webp">WebP (modern format)</option>
          </select>

          {/* Interactive Tiles matching template */}
          <div class={styles.formatTilesGrid}>
            {/* PNG Tile */}
            <button
              type="button"
              class={`${styles.formatTile} ${
                signature.outputFormat === 'png' ? styles.formatTileActive : ''
              }`}
              onClick={() => signature.setOutputFormat('png')}
            >
              {signature.outputFormat === 'png' && (
                <div class={styles.tileCheckCircle}>
                  <span>✓</span>
                </div>
              )}
              <DocFileIcon />
              <span class={styles.tileTitle}>PNG</span>
              <span class={styles.tileSubtitle}>Best for transparency</span>
            </button>

            {/* JPG Tile */}
            <button
              type="button"
              class={`${styles.formatTile} ${
                signature.outputFormat === 'jpg' ? styles.formatTileActive : ''
              }`}
              onClick={() => signature.setOutputFormat('jpg')}
            >
              {signature.outputFormat === 'jpg' && (
                <div class={styles.tileCheckCircle}>
                  <span>✓</span>
                </div>
              )}
              <DocFileIcon />
              <span class={styles.tileTitle}>JPG</span>
              <span class={styles.tileSubtitle}>Smaller file size</span>
            </button>

            {/* WebP Tile */}
            <button
              type="button"
              class={`${styles.formatTile} ${
                signature.outputFormat === 'webp' ? styles.formatTileActive : ''
              }`}
              onClick={() => signature.setOutputFormat('webp')}
            >
              {signature.outputFormat === 'webp' && (
                <div class={styles.tileCheckCircle}>
                  <span>✓</span>
                </div>
              )}
              <DocFileIcon />
              <span class={styles.tileTitle}>WebP</span>
              <span class={styles.tileSubtitle}>Modern format, Great quality</span>
            </button>
          </div>
        </div>

        {/* Background & Quality 2-column row */}
        <div class={styles.bgQualityRow}>
          {/* Background select */}
          <div class={styles.halfCol}>
            <label for={`${idPrefix}-background`} class={styles.inputLabel}>
              Background
            </label>
            <select
              id={`${idPrefix}-background`}
              class={styles.styledSelect}
              value={signature.background}
              onChange={(e) =>
                signature.setBackground(
                  (e.target as HTMLSelectElement).value as SignatureBackground,
                )
              }
            >
              <option value="transparent">Transparent (best for digital use)</option>
              <option value="white">White (pure white paper)</option>
              <option value="original">Original (keep background)</option>
            </select>
          </div>

          {/* Quality slider */}
          <div class={styles.halfCol}>
            <div class={styles.sliderHeader}>
              <label for={`${idPrefix}-quality`} class={styles.inputLabel}>
                Quality (JPG/WebP)
              </label>
              <span class={styles.qualityValBadge}>{signature.quality}%</span>
            </div>
            <input
              id={`${idPrefix}-quality`}
              type="range"
              min="50"
              max="100"
              aria-label="Maximum JPEG quality"
              value={signature.quality}
              class={styles.rangeSlider}
              onInput={(e) => signature.setQuality(Number((e.target as HTMLInputElement).value))}
            />
            <div class={styles.sliderScaleLabels}>
              <span>Smaller file size</span>
              <span>Higher quality</span>
            </div>
          </div>
        </div>

        {/* Optional Maximum file size (for Indian Exam/Official specs) */}
        <div class={styles.limitRow}>
          <label for={`${idPrefix}-limit`} class={styles.inputLabel}>
            Maximum file size
          </label>
          <div class={styles.inputWithUnit} style={{ width: '130px' }}>
            <input
              id={`${idPrefix}-limit`}
              type="number"
              min="1"
              max="25000"
              placeholder="Optional (e.g. 20 KB)"
              aria-label="Maximum file size"
              class={styles.dimInput}
              value={
                signature.maxFileSizeKB !== undefined && signature.maxFileSizeKB > 0
                  ? String(signature.maxFileSizeKB)
                  : ''
              }
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value.trim();
                signature.setMaxFileSizeKB(val ? Number(val) : undefined);
              }}
            />
            <span class={styles.unitBadge}>KB</span>
          </div>
        </div>

        {/* Download Button */}
        <div class={styles.downloadCtaWrap}>
          <button
            type="button"
            class={styles.goldDownloadBtn}
            name="Download signature"
            aria-label="Download signature"
            onClick={() => void signature.executeResizeAndDownload()}
            disabled={isExecuting}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download resized signature</span>
          </button>
          <div class={styles.downloadSubtext}>
            Your image is processed in your browser. No data is uploaded to our servers.
          </div>
        </div>
      </div>
    </aside>
  );
}
