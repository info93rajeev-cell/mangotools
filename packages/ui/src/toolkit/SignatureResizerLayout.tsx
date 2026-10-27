import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
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
      <div class={styles.workbench3Panel}>
        <SignatureResizerControls
          idPrefix={idPrefix}
          preset={preset}
          signature={signature}
          onSelectFile={signature.handleFileSelected}
          onTrySample={signature.loadSample}
        />
        <SignatureResizerCanvas idPrefix={idPrefix} signature={signature} />
        <SignatureResizerResult idPrefix={idPrefix} preset={preset} signature={signature} />
      </div>
    </div>
  );
}
