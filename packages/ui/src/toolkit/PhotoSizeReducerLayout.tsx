import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import { formatImageBytes } from './imageSizeFormat.ts';
import { PhotoSizeReducerCanvas } from './PhotoSizeReducerCanvas.tsx';
import { PhotoSizeReducerControls } from './PhotoSizeReducerControls.tsx';
import { PhotoSizeReducerResult } from './PhotoSizeReducerResult.tsx';
import styles from './photoSizeReducer.module.css';
import { usePhotoSizeReducer } from './usePhotoSizeReducer.ts';

export interface PhotoSizeReducerLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function PhotoSizeReducerLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: PhotoSizeReducerLayoutProps) {
  const photoSize = usePhotoSizeReducer(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-photo-size-reducer-layout="">
      {/* 3-PANEL PHOTO REDUCTION WORKBENCH */}
      <div class={styles.workbench3Panel} data-has-file={String(!!photoSize.file)}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <PhotoSizeReducerControls
          idPrefix={idPrefix}
          preset={preset}
          photoSize={photoSize}
          onSelectFile={(file) => void photoSize.loadFile(file)}
          onTrySample={() => void photoSize.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE VISUAL STAGE */}
        <PhotoSizeReducerCanvas idPrefix={idPrefix} photoSize={photoSize} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <PhotoSizeReducerResult idPrefix={idPrefix} preset={preset} photoSize={photoSize} />
      </div>

      <ImageMobileActionBar
        hasFile={!!photoSize.file && !!photoSize.imageSrc}
        phase={photoSize.phase}
        primaryLabel="Reduce Photo Size"
        onPrimaryClick={() => void photoSize.executeReduceAndDownload()}
        outputFileSize={photoSize.result?.outputFileSize}
        onDownload={photoSize.downloadResult}
        downloadLabel={
          photoSize.result
            ? `Download · ${formatImageBytes(photoSize.result.outputFileSize)}`
            : 'Download'
        }
        isDownloadDisabled={photoSize.phase !== 'result' || !photoSize.result}
        onReset={photoSize.reset}
      />
    </div>
  );
}
