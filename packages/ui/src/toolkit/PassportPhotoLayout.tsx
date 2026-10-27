import type { ResolvedPreset } from '@mangotools/schemas';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { PassportPhotoCanvas } from './PassportPhotoCanvas.tsx';
import { PassportPhotoControls } from './PassportPhotoControls.tsx';
import { PassportPhotoResult } from './PassportPhotoResult.tsx';
import styles from './passportPhoto.module.css';
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

  return (
    <div class={styles.container} data-passport-photo-layout="">
      {/* 3-PANEL PASSPORT WORKBENCH */}
      <div class={styles.workbench3Panel}>
        {/* PANEL 1: CONTROLS & PRESETS */}
        <PassportPhotoControls
          idPrefix={idPrefix}
          preset={preset}
          passport={passport}
          onSelectFile={(file) => void passport.loadFile(file)}
          onTrySample={() => void passport.loadSample()}
        />

        {/* PANEL 2: INTERACTIVE VISUAL STAGE & BIOMETRIC GUIDELINES */}
        <PassportPhotoCanvas idPrefix={idPrefix} passport={passport} />

        {/* PANEL 3: SPECIFICATIONS & DOWNLOAD CTA */}
        <PassportPhotoResult idPrefix={idPrefix} passport={passport} />
      </div>

      {passport.error && (
        <InlineAlert tone="danger" role="alert" data-passport-error="">
          {passport.error}
        </InlineAlert>
      )}
    </div>
  );
}
