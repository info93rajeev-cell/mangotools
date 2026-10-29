import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageCompressCanvas } from './ImageCompressCanvas.tsx';
import { ImageCompressControls } from './ImageCompressControls.tsx';
import { ImageCompressResult } from './ImageCompressResult.tsx';
import styles from './imageCompress.module.css';
import { useImageCompress } from './useImageCompress.ts';

export interface ImageCompressLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageCompressLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageCompressLayoutProps) {
  const compress = useImageCompress(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-image-compress-layout="">
      {/* 3-PANEL COMPRESS WORKBENCH */}
      <div class={styles.workbench3Panel} data-has-file={String(!!compress.file)}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageCompressControls
          idPrefix={idPrefix}
          preset={preset}
          compress={compress}
          onSelectFile={(file) => void compress.loadFile(file)}
          onTrySample={() => void compress.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS */}
        <ImageCompressCanvas idPrefix={idPrefix} compress={compress} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <ImageCompressResult idPrefix={idPrefix} preset={preset} compress={compress} />
      </div>
    </div>
  );
}
