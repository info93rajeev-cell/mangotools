import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageWatermarkCanvas } from './ImageWatermarkCanvas.tsx';
import { ImageWatermarkControls } from './ImageWatermarkControls.tsx';
import { ImageWatermarkResult } from './ImageWatermarkResult.tsx';
import styles from './imageWatermark.module.css';
import { useImageWatermark } from './useImageWatermark.ts';

export interface ImageWatermarkLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify?: (message: string) => void;
  onPhase?: (phase: FilePhase) => void;
}

export function ImageWatermarkLayout({
  idPrefix,
  toolId: _toolId,
  preset,
  notify: _notify,
  onPhase,
}: ImageWatermarkLayoutProps) {
  const watermark = useImageWatermark(preset, onPhase);

  return (
    <div class={styles.container} data-image-watermark-studio="">
      <div class={styles.workbench3Panel}>
        <ImageWatermarkControls
          idPrefix={idPrefix}
          preset={preset}
          watermark={watermark}
          onSelectFile={watermark.handleFileSelected}
          onTrySample={watermark.loadSample}
        />
        <ImageWatermarkCanvas idPrefix={idPrefix} watermark={watermark} />
        <ImageWatermarkResult idPrefix={idPrefix} preset={preset} watermark={watermark} />
      </div>
    </div>
  );
}
