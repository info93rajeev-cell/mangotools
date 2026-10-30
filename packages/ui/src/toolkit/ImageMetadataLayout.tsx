import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageMetadataCanvas } from './ImageMetadataCanvas.tsx';
import { ImageMetadataControls } from './ImageMetadataControls.tsx';
import { ImageMetadataResult } from './ImageMetadataResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import styles from './imageMetadata.module.css';
import { useImageMetadataRemover } from './useImageMetadataRemover.ts';

export interface ImageMetadataLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify?: (message: string) => void;
  onPhase?: (phase: FilePhase) => void;
}

export function ImageMetadataLayout({
  idPrefix,
  toolId: _toolId,
  preset,
  notify,
  onPhase,
}: ImageMetadataLayoutProps) {
  const meta = useImageMetadataRemover(preset, onPhase, notify);

  const hasFile = !!meta.file;
  const isError = meta.phase === 'error' || !!meta.error;
  const isBusy = meta.phase === 'running';

  return (
    <div class={styles.container} data-image-metadata-remover-studio="">
      <div class={styles.studioTop2Col}>
        <ImageMetadataCanvas
          idPrefix={idPrefix}
          meta={meta}
          onSelectFile={meta.handleFileSelected}
          onTrySample={meta.loadSample}
        />
        <ImageMetadataControls idPrefix={idPrefix} preset={preset} meta={meta} />
      </div>

      <ImageMetadataResult idPrefix={idPrefix} preset={preset} meta={meta} />

      <ImageMobileActionBar
        hasFile={hasFile}
        phase={meta.phase}
        primaryLabel={isBusy ? 'Cleaning...' : 'Clean & Download'}
        onPrimaryClick={() => void meta.executeCleanAndDownload()}
        outputFileSize={meta.result?.outputFileSize}
        onDownload={meta.downloadResult}
        downloadLabel="Download cleaned image"
        isDownloadDisabled={!hasFile || isBusy || isError}
        onReset={meta.clearAll}
      />
    </div>
  );
}
