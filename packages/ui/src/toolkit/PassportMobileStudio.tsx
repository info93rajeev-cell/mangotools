import type { ResolvedPreset } from '@mangotools/schemas';
import { useRef, useState } from 'preact/hooks';
import { PassportMobileLanding } from './PassportMobileLanding.tsx';
import { type MobileToolTab, PassportMobileToolTabs } from './PassportMobileToolTabs.tsx';
import styles from './passportMobileStudio.module.css';
import type { UsePassportEnhanceStateReturn } from './usePassportEnhanceState.ts';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportMobileStudioProps {
  idPrefix: string;
  preset: ResolvedPreset;
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
  onSelectFile: (file: File) => void;
  onTrySample: () => void;
  onOpenCamera: () => void;
}

interface MobilePreviewProps {
  passport: UsePassportPhotoReturn;
  enhance: UsePassportEnhanceStateReturn;
}

function MobileStudioPreview({ passport, enhance }: MobilePreviewProps) {
  const { splitPosition, setSplitPosition, enhancedBlobUrl } = enhance;
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const rawImgSrc = passport.imageSrc || '/samples/passport-portrait.jpg';
  const displayEnhancedSrc = enhancedBlobUrl || rawImgSrc;

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging && previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, Math.round((rawX / rect.width) * 100)));
      setSplitPosition(pct);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setIsDragging(false);
  };

  return (
    <div
      class={styles.previewSection}
      ref={previewRef}
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsDragging(false)}
    >
      <div class={styles.splitWrapper}>
        <img src={displayEnhancedSrc} alt="Enhanced" class={styles.splitImageBase} />

        <div
          class={styles.splitBeforeClipped}
          style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
        >
          <img src={rawImgSrc} alt="Original Before" class={styles.splitImageBase} />
        </div>

        <div
          class={styles.splitDividerHandle}
          style={{ left: `${splitPosition}%` }}
          role="slider"
          aria-label="Before / After comparison"
          aria-valuenow={splitPosition}
          aria-valuemin={5}
          aria-valuemax={95}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div class={styles.splitDividerLine} />
          <div class={styles.splitHandleBubble}>‹›</div>
        </div>

        <span class={styles.badgeBefore}>Before</span>
        <span class={styles.badgeAfter}>Enhanced</span>
      </div>

      <div class={styles.previewStatusBar}>
        <span>
          ✓ {passport.targetWidth} × {passport.targetHeight} px
        </span>
        <span style={{ color: '#86efac' }}>Biometric Matched</span>
      </div>
    </div>
  );
}

function MobileStudioNavTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: MobileToolTab;
  onSelectTab: (tab: MobileToolTab) => void;
}) {
  return (
    <div class={styles.toolTabsBar}>
      <button
        type="button"
        class={styles.toolTabBtn}
        data-active={String(activeTab === 'presets')}
        onClick={() => onSelectTab('presets')}
      >
        <span>📐</span>
        <span>Presets</span>
      </button>
      <button
        type="button"
        class={styles.toolTabBtn}
        data-active={String(activeTab === 'adjust')}
        onClick={() => onSelectTab('adjust')}
      >
        <span>🎛️</span>
        <span>Adjust</span>
      </button>
      <button
        type="button"
        class={styles.toolTabBtn}
        data-active={String(activeTab === 'filters')}
        onClick={() => onSelectTab('filters')}
      >
        <span>🎨</span>
        <span>Filters</span>
      </button>
      <button
        type="button"
        class={styles.toolTabBtn}
        data-active={String(activeTab === 'retouch')}
        onClick={() => onSelectTab('retouch')}
      >
        <span>🩹</span>
        <span>Retouch</span>
      </button>
    </div>
  );
}

export function PassportMobileStudio({
  idPrefix,
  preset,
  passport,
  enhance,
  onSelectFile,
  onTrySample,
  onOpenCamera,
}: PassportMobileStudioProps) {
  const [activeTab, setActiveTab] = useState<MobileToolTab>('presets');
  const [isStudioEntered, setIsStudioEntered] = useState(false);
  const isExecuting = passport.phase === 'running';

  const handleSelectFile = (file: File) => {
    setIsStudioEntered(true);
    onSelectFile(file);
  };

  const handleTrySample = () => {
    setIsStudioEntered(true);
    onTrySample();
  };

  const handleResetToLanding = () => {
    setIsStudioEntered(false);
    passport.clearAll();
  };

  if (!isStudioEntered || !passport.file) {
    return (
      <div class={styles.mobileStudioWrap} data-passport-mobile-studio="">
        <PassportMobileLanding
          idPrefix={idPrefix}
          preset={preset}
          passport={passport}
          onSelectFile={handleSelectFile}
          onTrySample={handleTrySample}
          onOpenCamera={onOpenCamera}
        />
      </div>
    );
  }

  return (
    <div class={styles.mobileStudioWrap} data-passport-mobile-studio="">
      <div class={styles.studioContainer}>
        {/* Top Bar with Status and Actions */}
        <div class={styles.studioTopBar}>
          <div class={styles.studioTitleGroup}>
            <span>👤</span>
            <span>
              {passport.activePresetId === 'in'
                ? 'India 35×45mm'
                : passport.activePresetId === 'us'
                  ? 'US 2×2 inch'
                  : 'Passport Studio'}
            </span>
          </div>
          <div class={styles.studioActionsGroup}>
            <button type="button" class={styles.studioMiniBtn} onClick={onOpenCamera}>
              <span>📷 Selfie</span>
            </button>
            <button type="button" class={styles.studioMiniBtn} onClick={handleResetToLanding}>
              <span>🔄 Change</span>
            </button>
          </div>
        </div>

        {/* Sticky Top Live Preview */}
        <MobileStudioPreview passport={passport} enhance={enhance} />

        {/* Segmented Navigation Tabs */}
        <MobileStudioNavTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Tab Body Controls */}
        <PassportMobileToolTabs activeTab={activeTab} passport={passport} enhance={enhance} />

        {/* Sticky Bottom Action Buttons */}
        <div class={styles.bottomStickyActions}>
          <button
            type="button"
            class={styles.applyGoldBtn}
            onClick={() => void passport.executeGenerate()}
            disabled={isExecuting}
            data-generate-button=""
          >
            <span>⚡</span>
            <span>Apply</span>
          </button>
          <button
            type="button"
            class={styles.downloadGreenBtn}
            onClick={() =>
              void (passport.result
                ? passport.downloadResult()
                : passport.executeResizeAndDownload())
            }
            disabled={isExecuting}
            data-download-button=""
          >
            <span>📥</span>
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
