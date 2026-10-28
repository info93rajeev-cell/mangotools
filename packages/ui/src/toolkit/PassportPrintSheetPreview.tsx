import styles from './passportPhoto.module.css';
import type { UsePassportPhotoReturn } from './usePassportPhoto.ts';

export interface PassportPrintSheetPreviewProps {
  passport: UsePassportPhotoReturn;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Virtual sheet preview layout
export function PassportPrintSheetPreview({ passport }: PassportPrintSheetPreviewProps) {
  const { sheetLayout, isGeneratingSheet, printSheet, downloadSheet } = passport;
  const hasFile = !!passport.file;
  const isLandscape = sheetLayout.paperWidthMm > sheetLayout.paperHeightMm;
  const aspectRatio = `${sheetLayout.paperWidthMm} / ${sheetLayout.paperHeightMm}`;

  return (
    <div class={styles.sheetPreviewContainer}>
      {/* SHEET TOOLBAR */}
      <div class={styles.canvasToolbarRow}>
        <div class={styles.headerLeft}>
          <span class={styles.paperBadge}>
            📄 {sheetLayout.paper.name} ({Math.round(sheetLayout.paperWidthMm)} ×{' '}
            {Math.round(sheetLayout.paperHeightMm)} mm)
          </span>
          <span class={styles.countBadge}>
            📸 {sheetLayout.photoCount} Photos ({sheetLayout.cols} per row)
          </span>
        </div>

        <div class={styles.canvasToolbar}>
          <button
            type="button"
            class={styles.sheetActionBtn}
            onClick={() => void printSheet()}
            disabled={!hasFile || isGeneratingSheet}
            title="Direct Print using Browser Print Dialog"
          >
            🖨️ Direct Print
          </button>
          <button
            type="button"
            class={styles.sheetActionBtnSecondary}
            onClick={() => void downloadSheet()}
            disabled={!hasFile || isGeneratingSheet}
            title="Download high-resolution 300 DPI sheet image"
          >
            📥 Download Sheet
          </button>
        </div>
      </div>

      {/* VIRTUAL PAPER SHEET */}
      <div class={styles.sheetViewport}>
        <div
          class={styles.virtualPaper}
          style={{
            aspectRatio,
            height: isLandscape ? '190px' : '245px',
          }}
          data-paper-id={sheetLayout.paper.id}
        >
          {/* PHOTO SLOTS */}
          {sheetLayout.slots.map((slot) => {
            const leftPct = (slot.xMm / sheetLayout.paperWidthMm) * 100;
            const topPct = (slot.yMm / sheetLayout.paperHeightMm) * 100;
            const widthPct = (slot.widthMm / sheetLayout.paperWidthMm) * 100;
            const heightPct = (slot.heightMm / sheetLayout.paperHeightMm) * 100;

            return (
              <div
                key={slot.index}
                class={styles.sheetPhotoSlot}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                {hasFile && passport.imageSrc ? (
                  <img
                    src={passport.imageSrc}
                    alt={`Passport print ${slot.index + 1}`}
                    class={styles.slotImage}
                  />
                ) : (
                  <div class={styles.slotPlaceholder}>👤</div>
                )}
                <span class={styles.slotIndexBadge}>#{slot.index + 1}</span>
              </div>
            );
          })}

          {/* CUT LINE INDICATOR */}
          {sheetLayout.blankPercent >= 10 && (
            <div
              class={styles.sheetCutLine}
              style={{
                top: `${(sheetLayout.cutoffYMm / sheetLayout.paperHeightMm) * 100}%`,
              }}
            >
              <div class={styles.cutLineDashes} />
              <span class={styles.cutLineLabel}>
                ✂️ Cut along this line • Unused paper below can be reused
              </span>
            </div>
          )}

          {/* BLANK REUSABLE AREA */}
          {sheetLayout.blankPercent >= 15 && (
            <div
              class={styles.blankReusableArea}
              style={{
                top: `${(sheetLayout.cutoffYMm / sheetLayout.paperHeightMm) * 100}%`,
                height: `${((sheetLayout.paperHeightMm - sheetLayout.cutoffYMm) / sheetLayout.paperHeightMm) * 100}%`,
              }}
            >
              <div class={styles.blankAreaNotice}>
                <span>📄 Blank Reusable Paper ({sheetLayout.blankPercent}% of sheet)</span>
                <span class={styles.blankAreaSub}>
                  Keep remainder clean & cut off top strip for client
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER CALLOUT */}
      <div class={styles.sheetFooterCallout}>
        <span>💡</span>
        <span>
          <strong>Photo Studio Workflow:</strong> Printed photos fill top row(s). Cut off the top
          strip with trimmer or scissors; insert the clean remainder back into your printer.
        </span>
      </div>
    </div>
  );
}
