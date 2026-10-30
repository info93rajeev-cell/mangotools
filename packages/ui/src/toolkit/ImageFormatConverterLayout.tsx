import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { ImageFormatConverterCanvas } from './ImageFormatConverterCanvas.tsx';
import { ImageFormatConverterControls } from './ImageFormatConverterControls.tsx';
import { ImageFormatConverterResult } from './ImageFormatConverterResult.tsx';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import { resolveImageErrorMessage } from './imageErrorPresentation.ts';
import styles from './imageFormatConverter.module.css';
import { formatImageBytes } from './imageSizeFormat.ts';
import { useImageFormatConverter } from './useImageFormatConverter.ts';

export interface ImageFormatConverterLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function ImageFormatConverterLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: ImageFormatConverterLayoutProps) {
  const converter = useImageFormatConverter(preset, toolId, notify, onPhase);

  return (
    <div class={styles.container} data-image-format-converter-layout="">
      {/* 3-PANEL FORMAT CONVERTER WORKBENCH */}
      <div class={styles.workbench3Panel} data-has-file={String(!!converter.file)}>
        {/* PANEL 1: CONTROLS & INPUTS */}
        <ImageFormatConverterControls
          idPrefix={idPrefix}
          preset={preset}
          converter={converter}
          onSelectFile={(file) => void converter.loadFile(file)}
          onTrySample={() => void converter.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE CANVAS */}
        <ImageFormatConverterCanvas idPrefix={idPrefix} converter={converter} />

        {/* PANEL 3: LIVE SPECS & RESULT */}
        <ImageFormatConverterResult idPrefix={idPrefix} preset={preset} converter={converter} />
      </div>

      {converter.phase === 'error' && converter.error && (
        <InlineAlert tone="danger" role="alert" data-convert-error="">
          {resolveImageErrorMessage(converter.error, converter.file?.name)}
        </InlineAlert>
      )}

      <ImageMobileActionBar
        hasFile={!!converter.file && !!converter.imageSrc}
        phase={converter.phase}
        primaryLabel="Convert Format"
        onPrimaryClick={() => void converter.executeConvertAndDownload()}
        outputFileSize={converter.result?.outputFileSize}
        onDownload={converter.downloadResult}
        downloadLabel={
          converter.result
            ? `Download · ${formatImageBytes(converter.result.outputFileSize)}`
            : 'Download'
        }
        isDownloadDisabled={converter.phase !== 'result' || !converter.result}
        onReset={converter.reset}
      />
    </div>
  );
}
