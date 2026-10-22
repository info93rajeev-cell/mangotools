import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageBackgroundRemoverCanvas } from './ImageBackgroundRemoverCanvas.tsx';
import { ImageBackgroundRemoverControls } from './ImageBackgroundRemoverControls.tsx';
import { ImageBackgroundRemoverResult } from './ImageBackgroundRemoverResult.tsx';
import styles from './imageBackgroundRemover.module.css';
import { useImageBackgroundRemover } from './useImageBackgroundRemover.ts';

export interface ImageBackgroundRemoverLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageBackgroundRemoverLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageBackgroundRemoverLayoutProps) {
  const bgRemover = useImageBackgroundRemover(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-image-bg-remover-layout="">
      {/* 3-PANEL STUDIO WORKBENCH */}
      <div class={styles.workbench3Panel}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageBackgroundRemoverControls
          idPrefix={idPrefix}
          preset={preset}
          bgRemover={bgRemover}
          onSelectFile={(file) => void bgRemover.loadFile(file)}
          onTrySample={() => void bgRemover.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS STAGE */}
        <ImageBackgroundRemoverCanvas idPrefix={idPrefix} bgRemover={bgRemover} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <ImageBackgroundRemoverResult idPrefix={idPrefix} preset={preset} bgRemover={bgRemover} />
      </div>
    </div>
  );
}
