import type { ComponentChild, RefObject } from 'preact';
import { type StringKey, t } from '../strings/en.ts';
import type { ImageWorkbenchOverlayContext } from './ImageWorkbench.tsx';
import styles from './imageWorkbench.module.css';
import { handleMoveKey, handleResizeKey } from './imageWorkbenchDrag.ts';
import type {
  AspectRatioPreset,
  DisplayRect,
  HandlePosition,
  ImageDimensions,
  PixelRect,
} from './imageWorkbenchGeometry.ts';

const HANDLES: { pos: HandlePosition; className: string; labelKey: StringKey }[] = [
  { pos: 'nw', className: styles.handleNw, labelKey: 'imageWorkbench.handleTopLeft' },
  { pos: 'n', className: styles.handleN, labelKey: 'imageWorkbench.handleTop' },
  { pos: 'ne', className: styles.handleNe, labelKey: 'imageWorkbench.handleTopRight' },
  { pos: 'e', className: styles.handleE, labelKey: 'imageWorkbench.handleRight' },
  { pos: 'se', className: styles.handleSe, labelKey: 'imageWorkbench.handleBottomRight' },
  { pos: 's', className: styles.handleS, labelKey: 'imageWorkbench.handleBottom' },
  { pos: 'sw', className: styles.handleSw, labelKey: 'imageWorkbench.handleBottomLeft' },
  { pos: 'w', className: styles.handleW, labelKey: 'imageWorkbench.handleLeft' },
];

interface HandlesProps {
  currentRect: PixelRect;
  bounds: ImageDimensions;
  activeRatio: AspectRatioPreset;
  minSize: number;
  disabled: boolean;
  onHandleStart: (e: PointerEvent, handle: HandlePosition) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerCancel: (e: PointerEvent) => void;
  onUpdate: (rect: PixelRect) => void;
}

function WorkbenchHandles({
  currentRect,
  bounds,
  activeRatio,
  minSize,
  disabled,
  onHandleStart,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onUpdate,
}: HandlesProps) {
  return (
    <>
      {HANDLES.map(({ pos, className, labelKey }) => {
        const isWidth = pos.includes('w') || pos.includes('e');
        const valueNow = isWidth ? currentRect.width : currentRect.height;
        const valueMax = isWidth ? bounds.width : bounds.height;
        return (
          <div
            key={pos}
            class={`${styles.handle} ${className}`}
            role="slider"
            aria-label={t(labelKey)}
            aria-valuenow={valueNow}
            aria-valuemin={minSize}
            aria-valuemax={valueMax}
            aria-valuetext={`${currentRect.width} by ${currentRect.height} pixels`}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={(e) => onHandleStart(e, pos)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={(e) =>
              handleResizeKey(e, pos, currentRect, bounds, activeRatio, minSize, onUpdate)
            }
          />
        );
      })}
    </>
  );
}

interface SelectionProps extends HandlesProps {
  displayRect: DisplayRect;
  showGrid: boolean;
  onMoveStart: (e: PointerEvent) => void;
  renderOverlay?: (context: ImageWorkbenchOverlayContext) => ComponentChild;
  context: ImageWorkbenchOverlayContext;
}

function WorkbenchSelection({
  currentRect,
  displayRect,
  bounds,
  activeRatio,
  minSize,
  showGrid,
  disabled,
  onMoveStart,
  onHandleStart,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onUpdate,
  renderOverlay,
  context,
}: SelectionProps) {
  return (
    <section
      class={styles.selection}
      aria-label={t('imageWorkbench.selection')}
      aria-roledescription="crop selection"
      tabIndex={disabled ? -1 : 0}
      style={{
        left: `${displayRect.left}px`,
        top: `${displayRect.top}px`,
        width: `${displayRect.width}px`,
        height: `${displayRect.height}px`,
      }}
      onPointerDown={onMoveStart}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={(e) => handleMoveKey(e, currentRect, bounds, onUpdate)}
    >
      {showGrid && (
        <div class={styles.gridThirds} aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} class={styles.gridCell} />
          ))}
        </div>
      )}
      {renderOverlay?.(context)}
      <WorkbenchHandles
        currentRect={currentRect}
        bounds={bounds}
        activeRatio={activeRatio}
        minSize={minSize}
        disabled={disabled}
        onHandleStart={onHandleStart}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onUpdate={onUpdate}
      />
    </section>
  );
}

export interface WorkbenchStageProps extends SelectionProps {
  imgRef: RefObject<HTMLImageElement>;
  imageSrc: string;
  imageAlt: string;
  updateDisplaySize: () => void;
  renderImageOverlay?: (context: ImageWorkbenchOverlayContext) => ComponentChild;
}

export function WorkbenchStage({
  imgRef,
  imageSrc,
  imageAlt,
  updateDisplaySize,
  renderImageOverlay,
  context,
  ...selectionProps
}: WorkbenchStageProps) {
  return (
    <div class={styles.viewport}>
      <div class={styles.stage}>
        <img
          ref={imgRef}
          class={styles.image}
          src={imageSrc}
          alt={imageAlt}
          onLoad={updateDisplaySize}
        />
        {renderImageOverlay && <div class={styles.overlayLayer}>{renderImageOverlay(context)}</div>}
        <WorkbenchSelection context={context} {...selectionProps} />
      </div>
    </div>
  );
}
