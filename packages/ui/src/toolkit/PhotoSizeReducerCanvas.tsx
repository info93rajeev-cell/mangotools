import { useRef, useState } from 'preact/hooks';
import { formatBytes, StageSideView, StageSplitView } from './PhotoSizeComparisonViews.tsx';
import styles from './photoSizeReducer.module.css';
import type { UsePhotoSizeReducerReturn } from './usePhotoSizeReducer.ts';

export interface PhotoSizeReducerCanvasProps {
  idPrefix: string;
  photoSize: UsePhotoSizeReducerReturn;
}

type ViewMode = 'split' | 'side' | 'after' | 'before';

function ToolbarTabs({
  viewMode,
  onSetViewMode,
  onHoldOriginalStart,
  onHoldOriginalEnd,
  onResetSplit,
}: {
  viewMode: ViewMode;
  onSetViewMode: (m: ViewMode) => void;
  onHoldOriginalStart: () => void;
  onHoldOriginalEnd: () => void;
  onResetSplit: () => void;
}) {
  return (
    <>
      <div class={styles.viewModeTabs}>
        <button
          type="button"
          class={styles.viewModeTab}
          data-active={viewMode === 'split' ? 'true' : 'false'}
          onClick={() => onSetViewMode('split')}
          title="Interactive Before / After Split Slider"
        >
          ↔ Split
        </button>
        <button
          type="button"
          class={styles.viewModeTab}
          data-active={viewMode === 'side' ? 'true' : 'false'}
          onClick={() => onSetViewMode('side')}
          title="Side-by-side comparison"
        >
          ◫ Side-by-Side
        </button>
        <button
          type="button"
          class={styles.viewModeTab}
          data-active={viewMode === 'after' ? 'true' : 'false'}
          onClick={() => onSetViewMode('after')}
          title="View reduced output quality"
        >
          ✨ Reduced
        </button>
        <button
          type="button"
          class={styles.viewModeTab}
          data-active={viewMode === 'before' ? 'true' : 'false'}
          onClick={() => onSetViewMode('before')}
          title="View original photo"
        >
          👁️ Original
        </button>
      </div>

      {viewMode === 'split' && (
        <div style={{ display: 'flex', gap: '3px' }}>
          <button
            type="button"
            class={styles.compareBtn}
            onMouseDown={onHoldOriginalStart}
            onMouseUp={onHoldOriginalEnd}
            onTouchStart={onHoldOriginalStart}
            onTouchEnd={onHoldOriginalEnd}
            title="Hold to temporarily reveal original image"
          >
            👁️ Hold Before
          </button>
          <button
            type="button"
            class={styles.miniStageBtn}
            onClick={onResetSplit}
            title="Center the split slider at 50%"
          >
            50% Split
          </button>
        </div>
      )}
    </>
  );
}

function StageToolbar({
  hasResult,
  hasFile,
  viewMode,
  onSetViewMode,
  onHoldOriginalStart,
  onHoldOriginalEnd,
  onResetSplit,
  zoom,
  onZoom,
  onReset,
}: {
  hasResult: boolean;
  hasFile: boolean;
  viewMode: ViewMode;
  onSetViewMode: (m: ViewMode) => void;
  onHoldOriginalStart: () => void;
  onHoldOriginalEnd: () => void;
  onResetSplit: () => void;
  zoom: number;
  onZoom: (update: (z: number) => number) => void;
  onReset: () => void;
}) {
  return (
    <div class={styles.canvasToolbar}>
      <div class={styles.toolbarLeftGroup}>
        <div class={styles.canvasToolbarTitle}>
          <span aria-hidden="true">🖼️</span>
          <span>Photo Reduction Studio</span>
        </div>

        {hasResult && (
          <ToolbarTabs
            viewMode={viewMode}
            onSetViewMode={onSetViewMode}
            onHoldOriginalStart={onHoldOriginalStart}
            onHoldOriginalEnd={onHoldOriginalEnd}
            onResetSplit={onResetSplit}
          />
        )}
      </div>

      <div class={styles.canvasToolbarControls}>
        <button
          type="button"
          class={styles.canvasToolBtn}
          onClick={() => onZoom((z) => Math.min(250, z + 25))}
          title="Zoom In"
          aria-label="Zoom In"
          disabled={!hasFile}
        >
          🔍+
        </button>
        <button
          type="button"
          class={styles.canvasToolBtn}
          onClick={() => onZoom((z) => Math.max(50, z - 25))}
          title="Zoom Out"
          aria-label="Zoom Out"
          disabled={!hasFile}
        >
          🔍-
        </button>
        <button
          type="button"
          class={styles.canvasToolBtn}
          onClick={() => onZoom(() => 100)}
          title="Reset Zoom to 100%"
          disabled={!hasFile}
        >
          {zoom}%
        </button>
        <button
          type="button"
          class={styles.canvasToolBtn}
          onClick={onReset}
          title="Reset Settings"
          aria-label="Reset settings"
          disabled={!hasFile}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

function EmptyStageMessage() {
  return (
    <div class={styles.emptyStageMessage}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>No Photo Loaded</p>
      <p style={{ margin: '4px 0 0', fontSize: '11px' }}>
        Upload a photo or click "Try Sample" to begin
      </p>
    </div>
  );
}

function AwaitingReductionMessage({ photoSize }: { photoSize: UsePhotoSizeReducerReturn }) {
  return (
    <div class={styles.awaitingReductionContainer}>
      <img
        src={photoSize.imageSrc ?? ''}
        alt={photoSize.file?.name ?? 'Loaded photo'}
        class={styles.stageImage}
      />
      <div class={styles.awaitingOverlayPill}>
        <span>💡 Click "Reduce Photo Size" to preview compressed quality & compare</span>
        <button
          type="button"
          class={styles.quickPreviewBtn}
          onClick={() => void photoSize.executeReduce()}
          disabled={photoSize.phase === 'running'}
        >
          ⚡ Preview Reduction
        </button>
      </div>
    </div>
  );
}

function CanvasBodyContent({
  photoSize,
  viewMode,
  splitPos,
  imageBoxRef,
}: {
  photoSize: UsePhotoSizeReducerReturn;
  viewMode: ViewMode;
  splitPos: number;
  imageBoxRef: { current: HTMLDivElement | null };
}) {
  if (!photoSize.file || !photoSize.imageSrc) {
    return <EmptyStageMessage />;
  }

  if (!photoSize.result || !photoSize.resultUrl) {
    return <AwaitingReductionMessage photoSize={photoSize} />;
  }

  if (viewMode === 'split') {
    return (
      <StageSplitView
        originalSrc={photoSize.imageSrc}
        reducedSrc={photoSize.resultUrl}
        fileName={photoSize.file.name}
        origSize={photoSize.file.size}
        reducedSize={photoSize.result.outputFileSize}
        reductionPercent={photoSize.result.sizeChangePercent}
        splitPos={splitPos}
        containerRef={imageBoxRef}
      />
    );
  }

  if (viewMode === 'side') {
    return (
      <StageSideView
        originalSrc={photoSize.imageSrc}
        reducedSrc={photoSize.resultUrl}
        origSize={photoSize.file.size}
        reducedSize={photoSize.result.outputFileSize}
        origDims={photoSize.sourceDims}
        reducedDims={{
          width: photoSize.result.outputWidth,
          height: photoSize.result.outputHeight,
        }}
      />
    );
  }

  const isAfter = viewMode === 'after';
  const displaySrc = isAfter ? photoSize.resultUrl : photoSize.imageSrc;
  const pillLabel = isAfter
    ? `Reduced Output (${formatBytes(photoSize.result.outputFileSize)} • ${photoSize.result.outputWidth}×${photoSize.result.outputHeight} px)`
    : `Original Photo (${formatBytes(photoSize.file.size)} • ${photoSize.sourceDims.width}×${photoSize.sourceDims.height} px)`;

  return (
    <div class={styles.singleViewContainer}>
      <img
        src={displaySrc}
        alt={isAfter ? 'Reduced Output' : 'Original'}
        class={styles.stageImage}
      />
      <div class={styles.singleViewPill}>{pillLabel}</div>
    </div>
  );
}

export function PhotoSizeReducerCanvas({
  idPrefix: _idPrefix,
  photoSize,
}: PhotoSizeReducerCanvasProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const hasFile = Boolean(photoSize.file && photoSize.imageSrc);
  const hasResult = Boolean(photoSize.result && photoSize.resultUrl);

  const updateSplit = (clientX: number) => {
    if (!imageBoxRef.current) return;
    const rect = imageBoxRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (viewMode !== 'split') return;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    updateSplit(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;
    updateSplit(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const effectiveSplit = isHoldingOriginal ? 100 : splitPos;

  return (
    <section class={styles.canvasPanel} aria-label="Visual Photo Stage">
      <StageToolbar
        hasResult={hasResult}
        hasFile={hasFile}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onHoldOriginalStart={() => setIsHoldingOriginal(true)}
        onHoldOriginalEnd={() => setIsHoldingOriginal(false)}
        onResetSplit={() => setSplitPos(50)}
        zoom={zoomLevel}
        onZoom={setZoomLevel}
        onReset={photoSize.reset}
      />

      <div
        class={styles.canvasStageWrapper}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div
          class={styles.viewport}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <CanvasBodyContent
            photoSize={photoSize}
            viewMode={viewMode}
            splitPos={effectiveSplit}
            imageBoxRef={imageBoxRef}
          />
        </div>
      </div>
    </section>
  );
}
