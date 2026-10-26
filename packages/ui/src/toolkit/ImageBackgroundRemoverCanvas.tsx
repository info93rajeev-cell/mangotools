import { useState } from 'preact/hooks';
import styles from './imageBackgroundRemover.module.css';
import type { UseImageBackgroundRemoverReturn } from './useImageBackgroundRemover.ts';

export interface ImageBackgroundRemoverCanvasProps {
  idPrefix: string;
  bgRemover: UseImageBackgroundRemoverReturn;
}

export type PreviewBackdrop = 'checker' | 'white' | 'dark' | 'cyan';

interface StageControlsProps {
  hasFile: boolean;
  hasResult: boolean;
  showOriginal: boolean;
  zoom: number;
  backdrop: PreviewBackdrop;
  onToggleOriginal: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onBackdropChange: (b: PreviewBackdrop) => void;
}

function BackdropButton({
  active,
  title,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '2px 5px',
        fontSize: '10px',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: active ? 'var(--color-accent)' : 'var(--color-bg)',
        color: active ? 'var(--color-on-accent)' : 'var(--color-text)',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
}

function BackdropPicker({
  backdrop,
  onBackdropChange,
}: {
  backdrop: PreviewBackdrop;
  onBackdropChange: (b: PreviewBackdrop) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
      <BackdropButton
        active={backdrop === 'checker'}
        title="Checkerboard (Transparent)"
        icon="🏁"
        onClick={() => onBackdropChange('checker')}
      />
      <BackdropButton
        active={backdrop === 'white'}
        title="Pure White"
        icon="⬜"
        onClick={() => onBackdropChange('white')}
      />
      <BackdropButton
        active={backdrop === 'dark'}
        title="Dark Studio"
        icon="⬛"
        onClick={() => onBackdropChange('dark')}
      />
      <BackdropButton
        active={backdrop === 'cyan'}
        title="Cyan Inspection (Check Glass Transparency)"
        icon="🟦"
        onClick={() => onBackdropChange('cyan')}
      />
    </div>
  );
}

function ZoomControls({
  zoom,
  hasFile,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: {
  zoom: number;
  hasFile: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}) {
  return (
    <div class={styles.canvasControls}>
      <button
        type="button"
        class={styles.canvasBtn}
        onClick={onZoomIn}
        title="Zoom in"
        aria-label="Zoom in"
        disabled={!hasFile}
      >
        +
      </button>
      <span class={styles.zoomBadge}>{zoom}%</span>
      <button
        type="button"
        class={styles.canvasBtn}
        onClick={onZoomOut}
        title="Zoom out"
        aria-label="Zoom out"
        disabled={!hasFile}
      >
        -
      </button>
      <button
        type="button"
        class={styles.canvasBtn}
        onClick={onResetZoom}
        title="Reset zoom"
        aria-label="Reset zoom"
        disabled={!hasFile}
        style={{ width: 'auto', padding: '0 5px' }}
      >
        Reset
      </button>
    </div>
  );
}

function StageControls({
  hasFile,
  hasResult,
  showOriginal,
  zoom,
  backdrop,
  onToggleOriginal,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onBackdropChange,
}: StageControlsProps) {
  return (
    <div class={styles.canvasHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span class={styles.canvasTitle}>Visual Stage</span>
        {hasResult && (
          <button
            type="button"
            onClick={onToggleOriginal}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'var(--weight-bold)',
              cursor: 'pointer',
              color: showOriginal ? 'var(--color-accent)' : 'var(--color-text)',
            }}
          >
            {showOriginal ? '👁️ Original' : '✨ Cutout'}
          </button>
        )}
        {hasResult && !showOriginal && (
          <BackdropPicker backdrop={backdrop} onBackdropChange={onBackdropChange} />
        )}
      </div>
      <ZoomControls
        zoom={zoom}
        hasFile={hasFile}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
      />
    </div>
  );
}

function ViewportDisplay({
  hasFile,
  displaySrc,
  showOriginal,
  zoom,
  backdrop,
}: {
  hasFile: boolean;
  displaySrc: string | null;
  showOriginal: boolean;
  zoom: number;
  backdrop: PreviewBackdrop;
}) {
  const backdropStyle =
    !showOriginal && backdrop === 'white'
      ? { backgroundColor: '#ffffff', backgroundImage: 'none' }
      : !showOriginal && backdrop === 'dark'
        ? { backgroundColor: '#18181b', backgroundImage: 'none' }
        : !showOriginal && backdrop === 'cyan'
          ? { backgroundColor: '#0891b2', backgroundImage: 'none' }
          : undefined;

  return (
    <div class={styles.canvasViewport} style={backdropStyle}>
      {hasFile && displaySrc ? (
        <div class={styles.imageWrapper}>
          <img
            src={displaySrc}
            alt={showOriginal ? 'Original image' : 'Background removed preview'}
            class={styles.canvasImage}
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'center center',
            }}
          />
        </div>
      ) : (
        <div class={styles.emptyCanvasNotice}>
          <span class={styles.emptyIcon}>🖼️</span>
          <p>Upload an image or try our sample to remove background instantly.</p>
        </div>
      )}
    </div>
  );
}

export function ImageBackgroundRemoverCanvas({
  idPrefix: _idPrefix,
  bgRemover,
}: ImageBackgroundRemoverCanvasProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [backdrop, setBackdrop] = useState<PreviewBackdrop>('checker');

  const hasFile = !!bgRemover.file && !!bgRemover.imageSrc;
  const hasResult = !!bgRemover.result && !!bgRemover.resultUrl;
  const displaySrc = showOriginal
    ? bgRemover.imageSrc
    : (bgRemover.resultUrl ?? bgRemover.imageSrc);

  return (
    <main class={styles.canvasPanel} aria-label="Visual Workspace">
      <div class={styles.stageCard}>
        <StageControls
          hasFile={hasFile}
          hasResult={hasResult}
          showOriginal={showOriginal}
          zoom={zoom}
          backdrop={backdrop}
          onToggleOriginal={() => setShowOriginal((v) => !v)}
          onZoomIn={() => setZoom((z) => Math.min(250, z + 25))}
          onZoomOut={() => setZoom((z) => Math.max(50, z - 25))}
          onResetZoom={() => setZoom(100)}
          onBackdropChange={setBackdrop}
        />

        <ViewportDisplay
          hasFile={hasFile}
          displaySrc={displaySrc}
          showOriginal={showOriginal}
          zoom={zoom}
          backdrop={backdrop}
        />

        <div class={styles.metaRow}>
          {hasFile ? (
            <span class={styles.metaBadge}>
              {bgRemover.sourceDims.width} × {bgRemover.sourceDims.height} px •{' '}
              {hasResult ? 'Background Removed' : 'Awaiting Removal'}
            </span>
          ) : (
            <span class={styles.metaBadge}>No image selected</span>
          )}
        </div>

        <div class={styles.stageTrustBadge}>
          <span>🔒</span>
          <span>100% In-Browser. No Files Uploaded.</span>
        </div>
      </div>
    </main>
  );
}
