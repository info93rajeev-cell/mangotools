import type { ComponentChild, ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { type StringKey, t } from '../strings/en.ts';
import styles from './imageWorkbench.module.css';
import { useWorkbenchDrag } from './imageWorkbenchDrag.ts';
import type { AspectRatioPreset, PixelRect } from './imageWorkbenchGeometry.ts';
import { defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import { useWorkbenchState } from './imageWorkbenchState.ts';
import { WorkbenchStage } from './WorkbenchStage.tsx';

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
        <fieldset class={styles.ratioGroup}>
          <legend class={styles.ratioLabel}>{t('imageWorkbench.ratioLabel')}</legend>
          {RATIOS.map((item) => (
            <button
              key={item.value}
              type="button"
              class={styles.ratioButton}
              data-active={String(activeRatio === item.value)}
              aria-pressed={activeRatio === item.value}
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

interface FooterProps {
  showCoordinates: boolean;
  rect: PixelRect;
  children?: ComponentChildren;
}

function WorkbenchFooter({ showCoordinates, rect, children }: FooterProps) {
  const [debouncedStatus, setDebouncedStatus] = useState('');

  useEffect(() => {
    if (!showCoordinates) return;
    const timer = setTimeout(() => {
      setDebouncedStatus(
        t('imageWorkbench.selectionStatus', {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }),
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [showCoordinates, rect.x, rect.y, rect.width, rect.height]);

  if (!showCoordinates && !children) return null;

  return (
    <div class={styles.footer}>
      {showCoordinates && (
        <>
          <span class={styles.status} aria-hidden="true">
            {t('imageWorkbench.selectionStatus', {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            })}
          </span>
          <span class="visually-hidden" role="status" aria-live="polite">
            {debouncedStatus}
          </span>
        </>
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
