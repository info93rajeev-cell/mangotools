import { useState } from 'preact/hooks';
import styles from './signatureResizer.module.css';
import type { UseSignatureResizerReturn } from './useSignatureResizer.ts';

export interface SignatureResizerCanvasProps {
  idPrefix: string;
  signature: UseSignatureResizerReturn;
}

export function SignatureResizerCanvas({
  idPrefix: _idPrefix,
  signature,
}: SignatureResizerCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [bgMode, setBgMode] = useState<'white' | 'checker'>('white');

  const hasFile = !!signature.file;
  const targetW = signature.targetWidth || 480;
  const targetH = signature.targetHeight || 180;
  const aspectRatio = targetH > 0 ? targetW / targetH : 2.5;

  return (
    <main class={styles.canvasContainer} aria-label="Signature Canvas Preview">
      {/* TOP CANVAS TOOLBAR */}
      <div class={styles.canvasToolbar}>
        <div class={styles.toolbarInfo}>
          <span class={styles.dimensionBadge}>
            {signature.targetWidth} × {signature.targetHeight} px
          </span>
          <span class={styles.aspectBadge}>Aspect: {aspectRatio.toFixed(2)}:1</span>
          <span class={styles.formatBadge}>
            {signature.outputFormat === 'jpg' ? 'White BG' : 'Alpha'}
          </span>
        </div>

        <div class={styles.toolbarControls}>
          <div class={styles.viewToggleGroup}>
            <button
              type="button"
              class={`${styles.viewBtn} ${bgMode === 'white' ? styles.viewBtnActive : ''}`}
              onClick={() => setBgMode('white')}
              title="White paper background"
            >
              📄 White
            </button>
            <button
              type="button"
              class={`${styles.viewBtn} ${bgMode === 'checker' ? styles.viewBtnActive : ''}`}
              onClick={() => setBgMode('checker')}
              title="Checkerboard transparency"
            >
              🏁 Grid
            </button>
          </div>

          <div class={styles.zoomGroup}>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              title="Zoom Out"
            >
              −
            </button>
            <span class={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              class={styles.zoomBtn}
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              class={styles.zoomResetBtn}
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* STAGE AREA */}
      <div class={styles.stageViewport}>
        {hasFile && (signature.imageSrc || signature.resultUrl) ? (
          <div
            class={`${styles.signatureCanvasBox} ${
              bgMode === 'checker' ? styles.canvasCheckerboard : styles.canvasWhite
            }`}
            style={{
              aspectRatio: `${targetW} / ${targetH}`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Signature image contained and centered */}
            <img
              src={signature.resultUrl ?? signature.imageSrc ?? ''}
              alt="Signature preview"
              class={styles.signatureImg}
            />

            {/* Subtle guideline border */}
            <div class={styles.canvasBorderGuide} />
          </div>
        ) : (
          <div class={styles.emptyState}>
            <div class={styles.emptyIcon}>✍️</div>
            <p class={styles.emptyTitle}>No Signature Selected</p>
            <p class={styles.emptyHint}>
              Upload a scanned signature or click <strong>Sample</strong> to try an example.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div class={styles.canvasFooter}>
        <div class={styles.statusIndicator}>
          <span class={styles.statusDot} />
          <span>Exact Canvas Padding: Undistorted & Centered</span>
        </div>
        <div class={styles.engineNotice}>
          🔒 100% In-Browser Execution. Never leaves your device.
        </div>
      </div>
    </main>
  );
}
