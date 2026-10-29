import type { ResolvedPreset } from '@mangotools/schemas';
import { BiometricGuideSvg } from './PassportCropWorkbench.tsx';
import styles from './passportMobileStudio.module.css';
import { UniversalUploadDropzone } from './UniversalUploadDropzone.tsx';
import { PASSPORT_PRESETS, type UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportMobileLandingProps {
  idPrefix: string;
  preset: ResolvedPreset;
  passport: UsePassportPhotoReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
  onOpenCamera: () => void;
}

export function PassportMobileLanding({
  idPrefix,
  passport,
  onSelectFile,
  onTrySample,
  onOpenCamera,
}: PassportMobileLandingProps) {
  const isExecuting = passport.phase === 'running';

  return (
    <div class={styles.landingCard}>
      <div class={styles.landingTitleRow}>
        <span style={{ fontSize: '13px', fontWeight: '800' }}>Upload & Quick Setup</span>
        <span class={styles.landingBadge}>🛡️ 100% In-Browser</span>
      </div>

      <button
        type="button"
        class={styles.cameraHeroBtn}
        onClick={onOpenCamera}
        data-open-camera-button=""
      >
        <span>📷</span>
        <span>Take Selfie (Front Camera)</span>
      </button>

      <UniversalUploadDropzone
        idPrefix={`${idPrefix}-mobile`}
        accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        file={passport.file}
        thumbnailUrl={passport.imageSrc}
        dimensions={passport.sourceDims.width ? passport.sourceDims : null}
        onSelectFile={onSelectFile}
        onClear={passport.clearAll}
        disabled={isExecuting}
        primaryText="Drag & drop passport photo here"
        browseText="or browse files"
        supportHint="Supports JPG, PNG, WebP. Fits official visa standards."
        renderImgThumbnail={true}
      />

      <div class={styles.sampleActionRow}>
        <button
          type="button"
          class={styles.sampleActionBtn}
          onClick={onTrySample}
          disabled={isExecuting}
        >
          <span>✨ Try Sample Photo (Ava)</span>
        </button>
      </div>

      {/* HERO SHOWCASE WITH BIOMETRIC GUIDELINES */}
      <div class={styles.heroShowcaseCard}>
        <img
          src="/samples/passport-portrait.jpg"
          alt="Passport Biometric Reference"
          class={styles.heroShowcaseImg}
        />
        <div class={styles.heroGuideSvg}>
          <BiometricGuideSvg />
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div class={styles.quickPresetsRow}>
        {PASSPORT_PRESETS.slice(0, 4).map((p) => (
          <button
            key={p.id}
            type="button"
            class={styles.quickPresetChip}
            data-active={String(passport.activePresetId === p.id)}
            onClick={() => {
              passport.applyPreset(p);
              onTrySample();
            }}
          >
            {p.name} ({p.unit})
          </button>
        ))}
      </div>
    </div>
  );
}
