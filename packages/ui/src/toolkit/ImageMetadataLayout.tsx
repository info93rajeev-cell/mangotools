import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageMetadataCanvas } from './ImageMetadataCanvas.tsx';
import { ImageMetadataControls } from './ImageMetadataControls.tsx';
import { ImageMetadataResult } from './ImageMetadataResult.tsx';
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
  notify: _notify,
  onPhase,
}: ImageMetadataLayoutProps) {
  const meta = useImageMetadataRemover(preset, onPhase);

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
    </div>
  );
}
