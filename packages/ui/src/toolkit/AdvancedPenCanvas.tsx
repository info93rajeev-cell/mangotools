import { useCallback, useRef, useState } from 'preact/hooks';
import { SvgAnchorPoints, SvgCalloutBadge, SvgTangentHandles } from './AdvancedPenSvgOverlays.tsx';
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

  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
      if (dragHandlers.draggingTarget || dragHandlers.isDraggingPan) return;
      const coords = dragHandlers.getSvgCoords(e);
      if (!coords || activeTool !== 'add') return;
      const closest = findClosestSegment(path, coords.x, coords.y);
      if (closest && closest.distance < 40) {
        onInsertPoint(closest.segmentIndex, closest.t);
      }
    },
    [dragHandlers, activeTool, path, onInsertPoint],
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
            {showOriginal ? (
              <img src={imageSrc} alt="Original" class={styles.stageImage} />
            ) : cutoutResult ? (
              <img src={cutoutResult.blobUrl} alt="Cutout" class={styles.stageImage} />
            ) : (
              <img src={imageSrc} alt="Base" class={styles.stageImage} />
            )}

            {showMask && path.points.length > 0 && (
              // biome-ignore lint/a11y/useKeyWithClickEvents: Canvas click is handled by mouse coordinates
              <svg
                ref={svgRef}
                class={styles.pathOverlaySvg}
                viewBox={`0 0 ${imageDims.width} ${imageDims.height}`}
                onClick={handleSvgClick}
                role="img"
                aria-label="Editable vector Bezier path"
              >
                <title>Editable vector Bezier path</title>
                <path
                  d={pathToSvgD(path)}
                  class={styles.selectionCurve}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {path.points.length > 10 && <SvgCalloutBadge anchor={path.points[10]} />}
                {selectedPt && selectedPointIndex !== null && (
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
                  points={path.points}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
