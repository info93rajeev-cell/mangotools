import { useCallback, useRef, useState } from 'preact/hooks';
import { SvgAnchorPoints, SvgTangentHandles } from './AdvancedPenSvgOverlays.tsx';
import styles from './advancedPenSelection.module.css';
import { findClosestSegment, pathToSvgD } from './bezierPathModel.ts';
import type { UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

function CanvasTopToolbar({
  zoom,
  setZoom,
  setPan,
}: {
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  setPan: (p: { x: number; y: number }) => void;
}) {
  return (
    <div class={styles.canvasHeader}>
      <div class={styles.canvasTitleGroup}>
        <span class={styles.stepBadge}>3</span>
        <span class={styles.canvasTitle}>Edit Selection (Zoom & Pan)</span>
      </div>

      <div class={styles.zoomToolbar}>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Zoom Out"
          onClick={() => setZoom((prev) => Math.max(25, prev - 25))}
        >
          −
        </button>
        <span class={styles.zoomPercentBadge}>{zoom}%</span>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Zoom In"
          onClick={() => setZoom((prev) => Math.min(400, prev + 25))}
        >
          +
        </button>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Pan Tool"
          onClick={() => setPan({ x: 0, y: 0 })}
        >
          ✋
        </button>
        <button
          type="button"
          class={styles.toolIconBtn}
          title="Fit to Screen"
          onClick={() => {
            setZoom(() => 100);
            setPan({ x: 0, y: 0 });
          }}
        >
          ⛶
        </button>
      </div>
    </div>
  );
}

function useCanvasDragHandlers(
  pan: { x: number; y: number },
  setPan: (p: { x: number; y: number }) => void,
  imageDims: { width: number; height: number },
  onMovePoint: (idx: number, x: number, y: number) => void,
  onMoveHandle: (idx: number, handle: 'cp1' | 'cp2', x: number, y: number) => void,
  svgRef: { current: SVGSVGElement | null },
) {
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingTarget, setDraggingTarget] = useState<{
    pointIndex: number;
    type: 'anchor' | 'cp1' | 'cp2';
  } | null>(null);

  const getSvgCoords = useCallback(
    (e: MouseEvent) => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (imageDims.width / rect.width),
        y: (e.clientY - rect.top) * (imageDims.height / rect.height),
      };
    },
    [imageDims, svgRef],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsDraggingPan(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDraggingPan) {
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        return;
      }
      if (!draggingTarget) return;
      const coords = getSvgCoords(e);
      if (!coords) return;
      if (draggingTarget.type === 'anchor') {
        onMovePoint(draggingTarget.pointIndex, coords.x, coords.y);
      } else {
        onMoveHandle(draggingTarget.pointIndex, draggingTarget.type, coords.x, coords.y);
      }
    },
    [isDraggingPan, dragStart, draggingTarget, getSvgCoords, onMovePoint, onMoveHandle, setPan],
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingPan(false);
    setDraggingTarget(null);
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    draggingTarget,
    isDraggingPan,
    setDraggingTarget,
    getSvgCoords,
  };
}

type BrushPoint = { x: number; y: number };

/** Brush Add / Brush Remove: collects one stroke per press, in image pixels. */
function useBrushStroke(
  penSelection: UseAdvancedPenSelectionReturn,
  getSvgCoords: (e: MouseEvent) => { x: number; y: number } | null,
  svgRef: { current: SVGSVGElement | null },
) {
  const { activeTool, brushRadius, imageDims, addStroke } = penSelection;
  // The stroke lives in a ref so fast taps (down + up before a re-render) are never lost;
  // `live` only drives the on-screen preview.
  const pointsRef = useRef<BrushPoint[] | null>(null);
  const [live, setLive] = useState<BrushPoint[] | null>(null);
  const brushing = activeTool === 'brushAdd' || activeTool === 'brushRemove';
  const radius = useCallback(() => {
    const w = svgRef.current?.getBoundingClientRect().width || imageDims.width || 1;
    return Math.max(1, brushRadius * (imageDims.width / w));
  }, [brushRadius, imageDims.width, svgRef]);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!brushing || e.button !== 0 || e.altKey) return;
      const c = getSvgCoords(e);
      if (!c) return;
      e.preventDefault();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      pointsRef.current = [c];
      setLive([c]);
    },
    [brushing, getSvgCoords],
  );
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const pts = pointsRef.current;
      const c = pts ? getSvgCoords(e) : null;
      if (!pts || !c) return;
      pts.push(c);
      setLive([...pts]);
    },
    [getSvgCoords],
  );
  const onPointerUp = useCallback(() => {
    const pts = pointsRef.current;
    if (!pts) return;
    pointsRef.current = null;
    addStroke({
      mode: activeTool === 'brushAdd' ? 'add' : 'remove',
      radius: radius(),
      points: pts,
    });
    setLive(null);
  }, [activeTool, addStroke, radius]);

  return { brushing, live, liveRadius: radius(), onPointerDown, onPointerMove, onPointerUp };
}

export interface AdvancedPenCanvasProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Studio canvas view
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Canvas interaction logic
export function AdvancedPenCanvas({ penSelection }: AdvancedPenCanvasProps) {
  const {
    imageSrc,
    imageDims,
    path,
    selectedPointIndex,
    activeTool,
    bgMode,
    customColor,
    showOriginal,
    showMask,
    zoom,
    pan,
    cutoutResult,
    setSelectedPointIndex,
    setZoom,
    setPan,
    onMovePoint,
    onMoveHandle,
    onInsertPoint,
    onAppendPoint,
    onDeletePoint,
  } = penSelection;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragHandlers = useCanvasDragHandlers(
    pan,
    setPan,
    imageDims,
    onMovePoint,
    onMoveHandle,
    svgRef,
  );

  const brush = useBrushStroke(penSelection, dragHandlers.getSvgCoords, svgRef);

  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
      if (dragHandlers.draggingTarget || dragHandlers.isDraggingPan || e.altKey) return;
      const coords = dragHandlers.getSvgCoords(e);
      if (!coords) return;
      if (activeTool === 'pen') {
        onAppendPoint(coords.x, coords.y);
        return;
      }
      if (activeTool !== 'add') return;
      const closest = findClosestSegment(path, coords.x, coords.y);
      if (closest && closest.distance < 40) {
        onInsertPoint(closest.segmentIndex, closest.t);
      }
    },
    [dragHandlers, activeTool, path, onInsertPoint, onAppendPoint],
  );

  const selectedPt = selectedPointIndex !== null ? path.points[selectedPointIndex] : null;

  return (
    <div class={styles.centerCanvasCard}>
      <CanvasTopToolbar zoom={zoom} setZoom={setZoom} setPan={setPan} />

      {/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive canvas stage for mouse drag and path manipulation */}
      <div
        class={`${styles.canvasStageWrapper} ${
          bgMode === 'white'
            ? styles.bgWhite
            : bgMode === 'black'
              ? styles.bgBlack
              : bgMode === 'custom'
                ? styles.bgCustom
                : styles.bgCheckerboard
        }`}
        style={bgMode === 'custom' ? { backgroundColor: customColor } : undefined}
        onMouseDown={dragHandlers.handleMouseDown}
        onMouseMove={dragHandlers.handleMouseMove}
        onMouseUp={dragHandlers.handleMouseUp}
      >
        {!imageSrc ? (
          <div class={styles.emptyStagePlaceholder}>
            <span class={styles.emptyStageIcon}>🖼️</span>
            <p class={styles.emptyStageTitle}>No Image Loaded</p>
            <p class={styles.emptyStageSubtitle}>Upload an image or load sample to start editing</p>
          </div>
        ) : (
          <div
            class={styles.canvasTransformContainer}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {brush.brushing && !showOriginal && cutoutResult && (
              <img src={imageSrc} alt="" aria-hidden="true" class={styles.stageGhost} />
            )}
            {showOriginal ? (
              <img src={imageSrc} alt="Original" class={styles.stageImage} />
            ) : cutoutResult ? (
              <img src={cutoutResult.blobUrl} alt="Cutout" class={styles.stageImage} />
            ) : (
              <img src={imageSrc} alt="Base" class={styles.stageImage} />
            )}

            {
              // biome-ignore lint/a11y/useKeyWithClickEvents: Canvas click is handled by mouse coordinates
              <svg
                ref={svgRef}
                class={styles.pathOverlaySvg}
                viewBox={`0 0 ${imageDims.width} ${imageDims.height}`}
                onClick={handleSvgClick}
                onPointerDown={brush.onPointerDown}
                onPointerMove={brush.onPointerMove}
                onPointerUp={brush.onPointerUp}
                onPointerCancel={brush.onPointerUp}
                data-tool={activeTool}
                role="img"
                aria-label="Selection editor: click to add pen points, drag to paint with a brush"
              >
                <title>Selection editor</title>
                {showMask && path.points.length > 0 && (
                  <path
                    d={pathToSvgD(path)}
                    class={styles.selectionCurve}
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="2.5"
                    stroke-dasharray="4 2"
                  />
                )}
                {brush.live && (
                  <polyline
                    points={brush.live.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={
                      activeTool === 'brushAdd' ? 'rgba(22,163,74,0.45)' : 'rgba(220,38,38,0.45)'
                    }
                    stroke-width={brush.liveRadius * 2}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                )}
                {showMask && selectedPt && selectedPointIndex !== null && (
                  <SvgTangentHandles
                    selectedPt={selectedPt}
                    selectedPointIndex={selectedPointIndex}
                    onHandleMouseDown={(idx, type, e) => {
                      e.stopPropagation();
                      dragHandlers.setDraggingTarget({ pointIndex: idx, type });
                    }}
                  />
                )}
                <SvgAnchorPoints
                  points={showMask ? path.points : []}
                  selectedPointIndex={selectedPointIndex}
                  onNodeClick={(idx, e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete') onDeletePoint(idx);
                    else setSelectedPointIndex(idx);
                  }}
                  onNodeMouseDown={(idx, e) => {
                    e.stopPropagation();
                    setSelectedPointIndex(idx);
                    if (activeTool !== 'delete') {
                      dragHandlers.setDraggingTarget({ pointIndex: idx, type: 'anchor' });
                    }
                  }}
                />
              </svg>
            }
          </div>
        )}
      </div>
    </div>
  );
}
