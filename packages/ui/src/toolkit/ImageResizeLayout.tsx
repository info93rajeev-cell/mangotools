import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import { ImageResizeCanvas } from './ImageResizeCanvas.tsx';
import { ImageResizeControls } from './ImageResizeControls.tsx';
import { ImageResizeResult } from './ImageResizeResult.tsx';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import styles from './imageResize.module.css';
import { formatImageBytes } from './imageSizeFormat.ts';
import { useImageResize } from './useImageResize.ts';

export interface ImageResizeLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageResizeLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageResizeLayoutProps) {
  const resize = useImageResize(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-image-resize-layout="">
      {/* 3-PANEL RESIZE WORKBENCH */}
      <div class={styles.workbench3Panel} data-has-file={String(!!resize.file)}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageResizeControls
          idPrefix={idPrefix}
          preset={preset}
          resize={resize}
          onSelectFile={(file) => void resize.loadFile(file)}
          onTrySample={() => void resize.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS */}
        <ImageResizeCanvas idPrefix={idPrefix} resize={resize} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <ImageResizeResult idPrefix={idPrefix} resize={resize} />
      </div>

      {resize.phase === 'error' && resize.error && (
        <InlineAlert tone="danger" role="alert" data-resize-error="">
          {resolveImageErrorMessage(resize.error, resize.file?.name)}
        </InlineAlert>
      )}

      <ImageMobileActionBar
        hasFile={!!resize.file && !!resize.imageSrc}
        phase={resize.phase}
        primaryLabel="Resize Image"
        onPrimaryClick={() => void resize.executeResizeAndDownload()}
        outputFileSize={resize.result?.outputFileSize}
        onDownload={resize.downloadResult}
        downloadLabel={
          resize.result
            ? `Download · ${formatImageBytes(resize.result.outputFileSize)}`
            : 'Download'
        }
        isDownloadDisabled={resize.phase !== 'result' || !resize.result}
        onReset={resize.reset}
      />
    </div>
  );
}
