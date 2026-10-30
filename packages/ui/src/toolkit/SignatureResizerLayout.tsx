import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { ImageMobileActionBar } from './ImageMobileActionBar.tsx';
import { formatImageBytes } from './imageSizeFormat.ts';
import { SignatureResizerCanvas } from './SignatureResizerCanvas.tsx';
import { SignatureResizerControls } from './SignatureResizerControls.tsx';
import { SignatureResizerResult } from './SignatureResizerResult.tsx';
import styles from './signatureResizer.module.css';
import { useSignatureResizer } from './useSignatureResizer.ts';

export interface SignatureResizerLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify?: (message: string) => void;
  onPhase?: (phase: FilePhase) => void;
}

export function SignatureResizerLayout({
  idPrefix,
  toolId: _toolId,
  preset,
  notify: _notify,
  onPhase,
}: SignatureResizerLayoutProps) {
  const signature = useSignatureResizer(preset, onPhase);

  return (
    <div class={styles.container} data-signature-resizer-studio="">
      <div class={styles.studioTop2Col}>
        <SignatureResizerCanvas
          idPrefix={idPrefix}
          signature={signature}
          onSelectFile={signature.handleFileSelected}
        />
        <SignatureResizerControls
          idPrefix={idPrefix}
          preset={preset}
          signature={signature}
          onSelectFile={signature.handleFileSelected}
          onTrySample={signature.loadSample}
        />
      </div>
      <SignatureResizerResult idPrefix={idPrefix} preset={preset} signature={signature} />

      <ImageMobileActionBar
        hasFile={!!signature.file && !!signature.imageSrc}
        phase={signature.phase}
        primaryLabel="Resize Signature"
        onPrimaryClick={() => void signature.executeResizeAndDownload()}
        outputFileSize={signature.result?.outputFileSize}
        onDownload={() => void signature.executeResizeAndDownload()}
        downloadLabel={
          signature.result
            ? `Download · ${formatImageBytes(signature.result.outputFileSize)}`
            : 'Download Signature'
        }
        isDownloadDisabled={signature.phase === 'error' || !signature.file}
        onReset={signature.clearAll}
      />
    </div>
  );
}
