import styles from './passportMobileStudio.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportMobileSheetSectionProps {
  passport: UsePassportPhotoReturn;
}

export function PassportMobileSheetSection({ passport }: PassportMobileSheetSectionProps) {
  const { sheetLayout, paperSize, setPaperSize, printSheet, downloadSheet } = passport;

  return (
    <div class={styles.sheetSectionCard}>
      {/* SECTION HEADER */}
      <div class={styles.sectionCardHeader}>
        <div class={styles.sectionHeaderTitle}>
          <span>🖨️</span>
          <span>Studio Print Sheet (Multi-Photo for WhatsApp & Print)</span>
        </div>
      </div>

      {/* PAPER SELECTOR */}
      <div class={styles.sheetConfigRow}>
        <span class={styles.sheetLayoutMeta}>
          Paper Size: {sheetLayout.paper.name} ({sheetLayout.photoCount} photos per sheet)
        </span>
        <select
          class={styles.studioMiniBtn}
          style={{ width: '100%', padding: '8px' }}
          value={paperSize}
          onChange={(e) => setPaperSize((e.target as HTMLInputElement).value as typeof paperSize)}
        >
          <option value="4x6">4×6 inch (Quarter A4) - Standard Photo Paper (6 Photos)</option>
          <option value="a4">A4 Full Sheet (210×297 mm) - 8 Photos Grid</option>
          <option value="a5">Half A4 / A5 (148×210 mm) - 4 Photos Grid</option>
        </select>
      </div>

      {/* ACTION BUTTONS */}
      <div class={styles.sheetActionButtonsRow}>
        <button
          type="button"
          class={styles.shareWhatsAppBtn}
          onClick={() => void downloadSheet()}
          title="Download printable 300 DPI sheet to share on WhatsApp or print at shop"
        >
          <span>📄</span>
          <span>Save Sheet for WhatsApp / Print (JPG)</span>
        </button>

        <button
          type="button"
          class={styles.printDirectBtn}
          onClick={() => void printSheet()}
          title="Print directly to local printer"
        >
          <span>🖨️</span>
          <span>Direct Print Sheet</span>
        </button>
      </div>

      <div class={styles.sheetHintNotice}>
        <span>✓ 300 DPI High-Resolution Grid with dashed cutting scissors guidelines</span>
      </div>

      {/* BIOMETRIC GUIDELINES CARD */}
      <div class={styles.guidelinesCard}>
        <span class={styles.guidelinesTitle}>📋 Official Passport Biometric Rules:</span>
        <ul class={styles.guidelinesList}>
          <li>• Crown (Top of Head): 10-15% margin from top edge.</li>
          <li>• Eye Line: 40-50% position from bottom.</li>
          <li>• Chin Line: 15-20% margin from bottom edge.</li>
          <li>• Background: Plain light/white background, no shadows.</li>
          <li>• Face: Direct gaze, neutral expression, both ears visible.</li>
        </ul>
      </div>
    </div>
  );
}
