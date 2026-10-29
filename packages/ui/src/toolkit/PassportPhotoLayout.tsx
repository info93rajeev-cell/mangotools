import type { ResolvedPreset } from '@mangotools/schemas';
import { useEffect, useState } from 'preact/hooks';
import type { FilePhase } from '../archetypes/useFileTool.ts';
import { InlineAlert } from '../primitives/feedback.tsx';
import { PassportCameraModal } from './PassportCameraModal.tsx';
import { PassportMobileStudio } from './PassportMobileStudio.tsx';
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMobileStudioOpen, setIsMobileStudioOpen] = useState(false);

  useEffect(() => {
    if (
      passport.file &&
      passport.file.name !== 'passport-portrait.jpg' &&
      passport.file.name !== 'sample-passport-portrait.jpg'
    ) {
      setIsMobileStudioOpen(true);
    }
  }, [passport.file]);

  const handleSelectFile = (file: File) => {
    setIsMobileStudioOpen(true);
    void passport.loadFile(file);
  };

  const handleTrySample = () => {
    setIsMobileStudioOpen(true);
    void passport.loadSample();
  };

  const handleResetToLanding = () => {
    setIsMobileStudioOpen(false);
    passport.clearAll();
  };

  useEffect(() => {
    const src = passport.croppedImageSrc || passport.imageSrc || '/samples/passport-portrait.jpg';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageElement(img);
    img.src = src;
  }, [passport.croppedImageSrc, passport.imageSrc]);

  const enhance = usePassportEnhanceState(imageElement);

  return (
    <div class={styles.container} data-passport-photo-layout="">
      {/* MOBILE SINGLE-SCREEN WORKBENCH (State A Landing or State B Working Studio) */}
      <div class={styles.mobileOnly}>
        <PassportMobileStudio
          idPrefix={idPrefix}
          preset={preset}
          passport={passport}
          enhance={enhance}
          isStudioOpen={isMobileStudioOpen}
          onSelectFile={handleSelectFile}
          onTrySample={handleTrySample}
          onResetToLanding={handleResetToLanding}
          onOpenCamera={() => setIsCameraOpen(true)}
        />
      </div>

      {/* DESKTOP 3-PANEL WORKBENCH */}
      <div class={styles.desktopOnly}>
        <div class={styles.workbench3Panel}>
          {/* PANEL 1: CONTROLS & PRESETS (CARDS 1-4) */}
          <PassportPhotoControls
            idPrefix={idPrefix}
            preset={preset}
            passport={passport}
            onSelectFile={handleSelectFile}
            onTrySample={handleTrySample}
            onOpenCamera={() => setIsCameraOpen(true)}
          />

          {/* PANEL 2: INTERACTIVE VISUAL WORKSPACE (CARDS 5 & 6) */}
          <PassportPhotoCanvas idPrefix={idPrefix} passport={passport} enhance={enhance} />

          {/* PANEL 3: OUTPUT PREVIEW & SUMMARY (CARD 7) */}
          <PassportPhotoResult idPrefix={idPrefix} passport={passport} enhance={enhance} />
        </div>
      </div>

      {/* IN-BROWSER WEBRTC FRONT CAMERA CAPTURE MODAL */}
      <PassportCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleSelectFile}
      />

      {passport.error && (
        <InlineAlert tone="danger" role="alert" data-passport-error="">
          {passport.error}
        </InlineAlert>
      )}
    </div>
  );
}
