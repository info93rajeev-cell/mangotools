import { useRef } from 'preact/hooks';
import { CanvasTopToolbar, StageHint } from './AdvancedPenCanvasToolbar.tsx';
import { SvgAnchorPoints, SvgTangentHandles } from './AdvancedPenSvgOverlays.tsx';
import styles from './advancedPenSelection.module.css';
import { pathToSvgD } from './bezierPathModel.ts';
import { canClosePath } from './penPathEditing.ts';
import type { BgMode, UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';
import { usePenStageInput, useStageScale } from './usePenStageInput.ts';

export interface AdvancedPenCanvasProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

function bgClass(bgMode: BgMode): string {
  if (bgMode === 'white') return styles.bgWhite;
  if (bgMode === 'black') return styles.bgBlack;
  if (bgMode === 'custom') return styles.bgCustom;
  return styles.bgCheckerboard;
}

function StageImages({ pen, brushing }: { pen: UseAdvancedPenSelectionReturn; brushing: boolean }) {
  const { imageSrc, cutoutResult, showOriginal } = pen;
  if (!imageSrc) return null;
  return (
    <>
      {brushing && !showOriginal && cutoutResult && (
        <img src={imageSrc} alt="" aria-hidden="true" class={styles.stageGhost} />
      )}
      {showOriginal || !cutoutResult ? (
        <img src={imageSrc} alt={showOriginal ? 'Original' : 'Base'} class={styles.stageImage} />
      ) : (
        <img src={cutoutResult.blobUrl} alt="Cutout" class={styles.stageImage} />
      )}
    </>
  );
}

function EmptyStage() {
  return (
    <div class={styles.emptyStagePlaceholder}>
      <span class={styles.emptyStageIcon}>🖼️</span>
      <p class={styles.emptyStageTitle}>No Image Loaded</p>
      <p class={styles.emptyStageSubtitle}>Upload an image or try the sample in step 1</p>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio canvas view
export function AdvancedPenCanvas({ penSelection: pen }: AdvancedPenCanvasProps) {
  const { imageSrc, imageDims, path, selectedPointIndex, activeTool, showMask, zoom, pan } = pen;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const k = useStageScale(svgRef, imageDims.width, [zoom, imageSrc]);
  const input = usePenStageInput(pen, { svgRef, stageRef }, k);
  const selectedPt = selectedPointIndex !== null ? path.points[selectedPointIndex] : null;
  const live = input.brush.live;

  return (
    <div class={styles.centerCanvasCard}>
      <CanvasTopToolbar
        zoom={zoom}
        setZoom={pen.setZoom}
        setPan={pen.setPan}
        activeTool={activeTool}
        setActiveTool={pen.setActiveTool}
      />
      {imageSrc ? <StageHint activeTool={activeTool} path={path} /> : null}

      <div
        ref={stageRef}
        class={`${styles.canvasStageWrapper} ${bgClass(pen.bgMode)}`}
        style={pen.bgMode === 'custom' ? { backgroundColor: pen.customColor } : undefined}
        data-tool={activeTool}
        data-pan-mode={String(input.panMode)}
        data-panning={String(input.panning)}
        {...input.stageHandlers}
      >
        {!imageSrc ? (
          <EmptyStage />
        ) : (
          <div
            class={styles.canvasTransformContainer}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            <StageImages pen={pen} brushing={input.brush.brushing} />
            <svg
              ref={svgRef}
              class={styles.pathOverlaySvg}
              viewBox={`0 0 ${imageDims.width} ${imageDims.height}`}
              role="img"
              aria-label="Selection editor: place pen points, drag points and handles, or paint with a brush"
            >
              <title>Selection editor</title>
              {showMask && path.points.length > 0 && (
                <path
                  d={pathToSvgD(path)}
                  class={styles.selectionCurve}
                  fill={path.isClosed ? 'rgba(37,99,235,0.08)' : 'none'}
                  stroke="#2563eb"
                  stroke-width={2 * k}
                  stroke-dasharray={`${6 * k} ${3 * k}`}
                  pointer-events="none"
                />
              )}
              {live && (
                <polyline
                  points={live.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={
                    activeTool === 'brushAdd' ? 'rgba(22,163,74,0.45)' : 'rgba(220,38,38,0.45)'
                  }
                  stroke-width={input.brush.liveRadius * 2}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  pointer-events="none"
                />
              )}
              {showMask && selectedPt && selectedPointIndex !== null && (
                <SvgTangentHandles
                  selectedPt={selectedPt}
                  selectedPointIndex={selectedPointIndex}
                  k={k}
                  onHandlePointerDown={input.onHandlePointerDown}
                />
              )}
              <SvgAnchorPoints
                points={showMask ? path.points : []}
                selectedPointIndex={selectedPointIndex}
                closableFirst={activeTool === 'pen' && canClosePath(path)}
                k={k}
                onNodePointerDown={input.onAnchorPointerDown}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
