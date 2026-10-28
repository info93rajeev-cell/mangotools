import { PassportCropWorkbench } from './PassportCropWorkbench.tsx';
import { PassportPrintSheetPreview } from './PassportPrintSheetPreview.tsx';
import styles from './passportPhoto.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportPhotoCanvasProps {
  idPrefix: string;
  passport: UsePassportPhotoReturn;
}

export function PassportPhotoCanvas({ idPrefix, passport }: PassportPhotoCanvasProps) {
  const { activeStageView, setActiveStageView, sheetLayout } = passport;

  return (
    <section class={styles.canvasPanel} aria-label="Passport Photo Canvas Stage">
      {/* STAGE HEADER WITH VIEW TABS */}
      <div class={styles.canvasHeader}>
        <div class={styles.stageTabs}>
          <button
            type="button"
            class={styles.stageTabBtn}
            data-stage-tab="single"
            data-active={String(activeStageView === 'single')}
            onClick={() => setActiveStageView('single')}
            title="Single Photo Crop & Biometric Alignment"
          >
            👤 1. Photo & Crop
          </button>
          <button
            type="button"
            class={styles.stageTabBtn}
            data-stage-tab="sheet"
            data-active={String(activeStageView === 'sheet')}
            onClick={() => setActiveStageView('sheet')}
            title="Studio Multi-Photo Print Sheet Layout"
          >
            🖨️ 2. Print Sheet ({sheetLayout.photoCount} on {sheetLayout.paper.name})
          </button>
        </div>
      </div>

      {/* VIEW STAGE: CROP WORKBENCH OR PRINT SHEET PREVIEW */}
      <div class={styles.stageContentArea}>
        {activeStageView === 'single' ? (
          <PassportCropWorkbench idPrefix={idPrefix} passport={passport} />
        ) : (
          <PassportPrintSheetPreview passport={passport} />
        )}
      </div>

      <div class={styles.stageFooter}>
        <a href="/signature-resizer" class={styles.relatedActionLink}>
          Need a matching signature? Go to Signature Resizer →
        </a>
      </div>
    </section>
  );
}
