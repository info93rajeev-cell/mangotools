import type { ResolvedPreset } from '@mangotools/schemas';
import { BiometricGuideSvg } from './PassportCropWorkbench.tsx';
import styles from './passportMobileStudio.module.css';
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
  idPrefix: _idPrefix,
  passport,
  onSelectFile,
  onTrySample,
  onOpenCamera,
}: PassportMobileLandingProps) {
  const isExecuting = passport.phase === 'running';

  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  return (
    <div class={styles.landingCard}>
      {/* 2-PART COMPACT ACTION ROW: SELFIE + UPLOAD */}
      <div class={styles.twoPartActionRow}>
        {/* PART 1: FRONT CAMERA SELFIE */}
        <button
          type="button"
          class={styles.actionCardBtn}
          data-action-cam="true"
          onClick={onOpenCamera}
          disabled={isExecuting}
          data-open-camera-button=""
        >
          <div class={styles.actionIconCircle}>📷</div>
          <div class={styles.actionTextCol}>
            <span class={styles.actionMainText}>Take Selfie</span>
            <span class={styles.actionSubText}>Front Camera</span>
          </div>
        </button>

        {/* PART 2: UPLOAD / DRAG & DROP PHOTO */}
        <label class={styles.actionCardBtn} data-action-upload="true">
          <input
            type="file"
            accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            class={styles.hiddenFileInput}
            onChange={handleFileInput}
            disabled={isExecuting}
          />
          <div class={styles.actionIconCircle}>📁</div>
          <div class={styles.actionTextCol}>
            <span class={styles.actionMainText}>Upload Photo</span>
            <span class={styles.actionSubText}>Browse / Drop</span>
          </div>
        </label>
      </div>

      {/* COMPACT SAMPLE LINK */}
      <div class={styles.sampleRow}>
        <button
          type="button"
          class={styles.samplePillBtn}
          onClick={onTrySample}
          disabled={isExecuting}
        >
          ✨ Or Try Sample Photo (Ava)
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
