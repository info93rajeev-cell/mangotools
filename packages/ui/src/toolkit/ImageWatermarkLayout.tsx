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
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageWatermarkLayout({
  idPrefix,
  preset,
  notify,
  onPhase,
}: ImageWatermarkLayoutProps) {
  const watermark = useImageWatermark(preset, onPhase, notify);

  return (
    <div class={styles.container} data-image-watermark-layout="">
      {/* 3-PANEL STUDIO WORKBENCH */}
      <div class={styles.workbench3Panel}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageWatermarkControls
          idPrefix={idPrefix}
          preset={preset}
          watermark={watermark}
          onSelectFile={(file) => void watermark.loadFile(file)}
          onTrySample={() => void watermark.loadPalaceSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS STAGE */}
        <ImageWatermarkCanvas watermark={watermark} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <ImageWatermarkResult idPrefix={idPrefix} preset={preset} watermark={watermark} />
      </div>
    </div>
  );
}
