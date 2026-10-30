import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageCompressCanvas } from './ImageCompressCanvas.tsx';
import { ImageCompressControls } from './ImageCompressControls.tsx';
import { ImageCompressResult } from './ImageCompressResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import styles from './imageCompress.module.css';
import { formatImageBytes } from './imageSizeFormat.ts';
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

      <ImageMobileActionBar
        hasFile={!!compress.file && !!compress.imageSrc}
        phase={compress.phase}
        primaryLabel="Compress Image"
        onPrimaryClick={() => void compress.executeCompressAndDownload()}
        outputFileSize={compress.result?.outputFileSize}
        onDownload={compress.downloadResult}
        downloadLabel={
          compress.result
            ? `Download · ${formatImageBytes(compress.result.outputFileSize)}`
            : 'Download'
        }
        isDownloadDisabled={compress.phase !== 'result' || !compress.result}
        onReset={compress.reset}
      />
    </div>
  );
}
