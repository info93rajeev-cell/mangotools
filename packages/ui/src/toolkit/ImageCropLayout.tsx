import type { ResolvedPreset } from '@mangotools/schemas';
import { useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { Button } from '../primitives/Button.tsx';
import { InlineAlert } from '../primitives/feedback.tsx';
import { ImageCropCanvas } from './ImageCropCanvas.tsx';
import { ImageCropControls } from './ImageCropControls.tsx';
import { ImageCropDocCards } from './ImageCropDocCards.tsx';
import { ImageCropResult } from './ImageCropResult.tsx';
import styles from './imageCrop.module.css';
import { defaultSelectionRect } from './imageWorkbenchGeometry.ts';
import { label, messageFor } from './presentation.ts';
import { useImageCrop } from './useImageCrop.ts';

export interface ImageCropLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageCropLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageCropLayoutProps) {
  const crop = useImageCrop(preset, toolId, notify, onPhase);
  const [lockRatio, setLockRatio] = useState(false);

  const estSizeKb = Math.max(
    1,
    Math.round(
      ((crop.file?.size ?? 1843200) * (crop.cropRect.width * crop.cropRect.height)) /
        Math.max(1, crop.sourceDims.width * crop.sourceDims.height) /
        1024,
    ),
  );

  return (
    <div class={styles.container} data-image-crop-layout="">
      {/* 3-PANEL CROP WORKBENCH */}
      <div class={styles.workbench3Panel}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageCropControls
          idPrefix={idPrefix}
          preset={preset}
          crop={crop}
          lockRatio={lockRatio}
          onToggleLockRatio={() => setLockRatio(!lockRatio)}
          onSelectFile={(file) => void crop.loadFile(file)}
          onTryPalaceSample={() => void crop.loadPalaceSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS */}
        <ImageCropCanvas
          idPrefix={idPrefix}
          imageSrc={crop.imageSrc ?? ''}
          imageAlt={crop.file?.name ?? 'Image to crop'}
          sourceWidth={crop.sourceDims.width}
          sourceHeight={crop.sourceDims.height}
          cropRect={crop.cropRect}
          onChangeCropRect={crop.setCropRect}
          ratio={crop.ratio}
          onChangeRatio={crop.setRatio}
          onReset={() => crop.setCropRect(defaultSelectionRect(crop.sourceDims, crop.ratio))}
        />

        {/* PANEL 3: LIVE SPEC / RESULT */}
        <div class={styles.resultPanel}>
          {crop.phase === 'result' && crop.result && crop.resultUrl ? (
            <ImageCropResult
              preset={preset}
              result={crop.result}
              resultUrl={crop.resultUrl}
              onDownload={crop.downloadCurrentResult}
            />
          ) : (
            <div class={styles.panelCard} data-crop-ready-panel="">
              <div class={styles.statusBannerReady}>
                <span>✓</span>
                <span>Ready to Crop</span>
              </div>

              <div class={styles.previewThumbWrapper}>
                {crop.imageSrc ? (
                  <img src={crop.imageSrc} alt="Live crop preview" class={styles.previewThumbImg} />
                ) : (
                  <div class={styles.dropSub}>No preview</div>
                )}
              </div>

              <dl class={styles.specTable}>
                <div class={styles.specItem}>
                  <dt class={styles.specLabel}>Source Dims</dt>
                  <dd class={styles.specValue}>
                    {crop.sourceDims.width} × {crop.sourceDims.height}
                  </dd>
                </div>
                <div class={styles.specItem}>
                  <dt class={styles.specLabel}>Crop Dims</dt>
                  <dd class={styles.specValue}>
                    {Math.round(crop.cropRect.width)} × {Math.round(crop.cropRect.height)}
                  </dd>
                </div>
                <div class={styles.specItem}>
                  <dt class={styles.specLabel}>Output Format</dt>
                  <dd class={styles.specValue}>{crop.resolvedFormat.toUpperCase()}</dd>
                </div>
                <div class={styles.specItem}>
                  <dt class={styles.specLabel}>Estimated Size</dt>
                  <dd class={styles.specValue}>~{estSizeKb} KB</dd>
                </div>
              </dl>

              <Button
                variant="primary"
                icon="download"
                onClick={crop.runCrop}
                loading={crop.phase === 'running'}
                disabled={crop.phase === 'running'}
                data-crop-button=""
              >
                {label(preset, 'fileTool.downloadCta')}
              </Button>

              <div class={styles.privacyShield}>
                <span>🔒</span>
                <span>100% In-Browser. No Files Uploaded.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {crop.phase === 'error' && crop.error && (
        <InlineAlert tone="danger" role="alert" data-crop-error="">
          {messageFor(preset, crop.error)}
        </InlineAlert>
      )}

      {/* 5 INFORMATIONAL GUIDE CARDS */}
      <ImageCropDocCards />
    </div>
  );
}
