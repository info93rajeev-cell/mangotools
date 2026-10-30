import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
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
  notify,
  onPhase,
}: ImageWatermarkLayoutProps) {
  const watermark = useImageWatermark(preset, onPhase, notify);

  const hasFile = !!watermark.file;
  const isError = watermark.phase === 'error' || !!watermark.error;
  const isBusy = watermark.phase === 'running';

  return (
    <div class={styles.container} data-image-watermark-studio="">
      <div class={styles.studioTop2Col}>
        <ImageWatermarkCanvas
          idPrefix={idPrefix}
          watermark={watermark}
          onSelectFile={watermark.handleFileSelected}
          onTrySample={watermark.loadSample}
        />
        <ImageWatermarkControls idPrefix={idPrefix} preset={preset} watermark={watermark} />
      </div>

      <ImageWatermarkResult idPrefix={idPrefix} preset={preset} watermark={watermark} />

      <ImageMobileActionBar
        hasFile={hasFile}
        phase={watermark.phase}
        primaryLabel={isBusy ? 'Applying...' : 'Apply & Download'}
        onPrimaryClick={() => void watermark.executeWatermarkAndDownload()}
        outputFileSize={watermark.result?.outputFileSize}
        onDownload={watermark.downloadResult}
        downloadLabel="Download watermarked image"
        isDownloadDisabled={!hasFile || isBusy || isError}
        onReset={watermark.clearAll}
      />
    </div>
  );
}
