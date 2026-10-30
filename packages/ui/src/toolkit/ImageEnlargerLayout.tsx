import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageEnlargerCanvas } from './ImageEnlargerCanvas.tsx';
import { ImageEnlargerControls } from './ImageEnlargerControls.tsx';
import { ImageEnlargerResult } from './ImageEnlargerResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import styles from './imageEnlarger.module.css';
import { useImageEnlarger } from './useImageEnlarger.ts';

export interface ImageEnlargerLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageEnlargerLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageEnlargerLayoutProps) {
  const enlarger = useImageEnlarger(preset, toolId, notify, onPhase);

  const hasFile = !!enlarger.file;
  const isError = enlarger.phase === 'error' || !!enlarger.error;
  const isBusy = enlarger.phase === 'running';

  return (
    <div class={styles.container} data-image-enlarger-layout="">
      <div class={styles.workbench3Panel} data-has-file={String(hasFile)}>
        {/* PANEL 1: CONTROLS & SLIDERS */}
        <ImageEnlargerControls
          idPrefix={idPrefix}
          preset={preset}
          enlarger={enlarger}
          onSelectFile={(file) => void enlarger.loadFile(file)}
          onTrySample={() => void enlarger.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE VISUAL CANVAS */}
        <ImageEnlargerCanvas idPrefix={idPrefix} enlarger={enlarger} />

        {/* PANEL 3: SPECS & DOWNLOAD */}
        <ImageEnlargerResult idPrefix={idPrefix} preset={preset} enlarger={enlarger} />
      </div>

      <ImageMobileActionBar
        hasFile={hasFile}
        phase={enlarger.phase}
        primaryLabel={isBusy ? 'Enhancing...' : 'Enhance & Download'}
        onPrimaryClick={() => void enlarger.executeEnlarge()}
        outputFileSize={enlarger.result?.outputFileSize}
        onDownload={() => void enlarger.downloadResult()}
        downloadLabel="Download enlarged image"
        isDownloadDisabled={!hasFile || isBusy || isError}
        onReset={enlarger.reset}
      />
    </div>
  );
}
