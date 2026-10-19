import type { ComponentChild, ComponentChildren, RefObject } from 'preact';
import { Button } from '../primitives/Button.tsx';
import { type StringKey, t } from '../strings/en.ts';
import styles from './imageWorkbench.module.css';
import { handleMoveKey, handleResizeKey, useWorkbenchDrag } from './imageWorkbenchDrag.ts';
import type {
  AspectRatioPreset,
  DisplayRect,
  HandlePosition,
  ImageDimensions,
  PixelRect,
} from './imageWorkbenchGeometry.ts';
import { defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import { useWorkbenchState } from './imageWorkbenchState.ts';

export interface ImageWorkbenchOverlayContext {
  sourceWidth: number;
  sourceHeight: number;
  displayedWidth: number;
  displayedHeight: number;
  scale: number;
  selection: PixelRect;
}

export interface ImageWorkbenchProps {
  idPrefix?: string;
  imageSrc: string;
  imageAlt?: string;
  sourceWidth: number;
  sourceHeight: number;
  value?: PixelRect;
  onChange?: (rect: PixelRect) => void;
  aspectRatio?: AspectRatioPreset;
  onAspectRatioChange?: (ratio: AspectRatioPreset) => void;
  minSelectionSize?: number;
  showAspectRatioControls?: boolean;
  showResetButton?: boolean;
  showCoordinates?: boolean;
  showGrid?: boolean;
  disabled?: boolean;
  renderSelectionOverlay?: (context: ImageWorkbenchOverlayContext) => ComponentChild;
  renderImageOverlay?: (context: ImageWorkbenchOverlayContext) => ComponentChild;
  children?: ComponentChildren;
}

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

const RATIOS: { value: AspectRatioPreset; labelKey: StringKey }[] = [
  { value: 'free', labelKey: 'imageWorkbench.ratioFree' },
  { value: '1:1', labelKey: 'imageWorkbench.ratio1to1' },
  { value: '4:3', labelKey: 'imageWorkbench.ratio4to3' },
  { value: '16:9', labelKey: 'imageWorkbench.ratio16to9' },
  { value: '35:45', labelKey: 'imageWorkbench.ratio35to45' },
];

interface ToolbarProps {
  showRatio: boolean;
  activeRatio: AspectRatioPreset;
  showReset: boolean;
  disabled: boolean;
  onRatio: (ratio: AspectRatioPreset) => void;
  onReset: () => void;
}

function WorkbenchToolbar({
  showRatio,
  activeRatio,
  showReset,
  disabled,
  onRatio,
  onReset,
}: ToolbarProps) {
  if (!showRatio && !showReset) return null;
  return (
    <div class={styles.toolbar}>
      {showRatio && (
        <fieldset class={styles.ratioGroup} aria-label={t('imageWorkbench.ratioLabel')}>
          <span class={styles.ratioLabel}>{t('imageWorkbench.ratioLabel')}</span>
          {RATIOS.map((item) => (
            <button
              key={item.value}
              type="button"
              class={styles.ratioButton}
              data-active={String(activeRatio === item.value)}
              onClick={() => onRatio(item.value)}
              disabled={disabled}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </fieldset>
      )}
      {showReset && (
        <Button variant="ghost" icon="reset" onClick={onReset} disabled={disabled}>
          {t('imageWorkbench.reset')}
        </Button>
      )}
    </div>
  );
}

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
      {HANDLES.map(({ pos, className, labelKey }) => (
        <div
          key={pos}
          class={`${styles.handle} ${className}`}
          role="slider"
          aria-label={t(labelKey)}
          aria-valuenow={
            pos.includes('w') || pos.includes('e') ? currentRect.width : currentRect.height
          }
          tabIndex={disabled ? -1 : 0}
          onPointerDown={(e) => onHandleStart(e, pos)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={(e) =>
            handleResizeKey(e, pos, currentRect, bounds, activeRatio, minSize, onUpdate)
          }
        />
      ))}
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

interface StageProps extends SelectionProps {
  imgRef: RefObject<HTMLImageElement>;
  imageSrc: string;
  imageAlt: string;
  updateDisplaySize: () => void;
  renderImageOverlay?: (context: ImageWorkbenchOverlayContext) => ComponentChild;
}

function WorkbenchStage({
  imgRef,
  imageSrc,
  imageAlt,
  updateDisplaySize,
  renderImageOverlay,
  context,
  ...selectionProps
}: StageProps) {
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

interface FooterProps {
  showCoordinates: boolean;
  rect: PixelRect;
  children?: ComponentChildren;
}

function WorkbenchFooter({ showCoordinates, rect, children }: FooterProps) {
  return (
    <div class={styles.footer}>
      {showCoordinates && (
        <span class={styles.status} aria-live="polite">
          {t('imageWorkbench.selectionStatus', {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          })}
        </span>
      )}
      <span class={styles.hint}>{t('imageWorkbench.dragHint')}</span>
      {children}
    </div>
  );
}

export function ImageWorkbench(props: ImageWorkbenchProps) {
  const minSize = props.minSelectionSize ?? 10;
  const disabled = props.disabled ?? false;
  const state = useWorkbenchState({ ...props, minSelectionSize: minSize });

  const dragHandlers = useWorkbenchDrag({
    rect: state.currentRect,
    scale: state.scale,
    bounds: state.bounds,
    ratio: state.activeRatio,
    minSize,
    disabled,
    onUpdate: state.updateRect,
  });

  const context: ImageWorkbenchOverlayContext = {
    sourceWidth: props.sourceWidth,
    sourceHeight: props.sourceHeight,
    displayedWidth: state.displaySize.width,
    displayedHeight: state.displaySize.height,
    scale: state.scale,
    selection: state.currentRect,
  };

  return (
    <div class={styles.workbench}>
      <WorkbenchToolbar
        showRatio={props.showAspectRatioControls ?? true}
        activeRatio={state.activeRatio}
        showReset={props.showResetButton ?? true}
        disabled={disabled}
        onRatio={state.handleRatio}
        onReset={() => state.updateRect(defaultSelectionRect(state.bounds, state.activeRatio))}
      />
      <WorkbenchStage
        imgRef={state.imgRef}
        imageSrc={props.imageSrc}
        imageAlt={props.imageAlt ?? ''}
        updateDisplaySize={state.updateDisplaySize}
        renderImageOverlay={props.renderImageOverlay}
        renderOverlay={props.renderSelectionOverlay}
        currentRect={state.currentRect}
        displayRect={state.displayRect}
        bounds={state.bounds}
        activeRatio={state.activeRatio}
        minSize={minSize}
        showGrid={props.showGrid ?? true}
        disabled={disabled}
        context={context}
        onUpdate={state.updateRect}
        {...dragHandlers}
      />
      <WorkbenchFooter showCoordinates={props.showCoordinates ?? true} rect={state.currentRect}>
        {props.children}
      </WorkbenchFooter>
    </div>
  );
}
