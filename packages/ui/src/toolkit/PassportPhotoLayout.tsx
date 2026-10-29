import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { PassportPhotoCanvas } from './PassportPhotoCanvas.tsx';
import { PassportPhotoControls } from './PassportPhotoControls.tsx';
import { PassportPhotoResult } from './PassportPhotoResult.tsx';
import styles from './passportPhoto.module.css';
import { usePassportEnhanceState } from './usePassportEnhanceState.ts';
import { usePassportPhoto } from './usePassportPhoto.ts';

export interface PassportPhotoLayoutProps {
  idPrefix: string;
  toolId: string;
  preset: ResolvedPreset;
  notify: (message: string) => void;
  onPhase: (phase: FilePhase) => void;
}

export function PassportPhotoLayout({
  idPrefix,
  toolId,
  preset,
  notify,
  onPhase,
}: PassportPhotoLayoutProps) {
  const passport = usePassportPhoto(preset, toolId, notify, onPhase);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const src = passport.imageSrc || '/samples/passport-portrait.jpg';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageElement(img);
    img.src = src;
  }, [passport.imageSrc]);

  const enhance = usePassportEnhanceState(imageElement);

  return (
    <div class={styles.container} data-passport-photo-layout="">
      {/* 3-PANEL PASSPORT WORKBENCH */}
      <div class={styles.workbench3Panel}>
        {/* PANEL 1: CONTROLS & PRESETS (CARDS 1-4) */}
        <PassportPhotoControls
          idPrefix={idPrefix}
          preset={preset}
          passport={passport}
          onSelectFile={(file) => void passport.loadFile(file)}
          onTrySample={() => void passport.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE VISUAL WORKSPACE (CARDS 5 & 6) */}
        <PassportPhotoCanvas idPrefix={idPrefix} passport={passport} enhance={enhance} />

        {/* PANEL 3: OUTPUT PREVIEW & SUMMARY (CARD 7) */}
        <PassportPhotoResult idPrefix={idPrefix} passport={passport} enhance={enhance} />
      </div>

      {passport.error && (
        <InlineAlert tone="danger" role="alert" data-passport-error="">
          {passport.error}
        </InlineAlert>
      )}
    </div>
  );
}
