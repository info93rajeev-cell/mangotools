import styles from './advancedPenSelection.module.css';
import type { BgMode, UseAdvancedPenSelectionReturn } from './useAdvancedPenSelection.ts';

function Step4EdgeCard({
  edgeSettings,
  setEdgeSettings,
}: {
  edgeSettings: UseAdvancedPenSelectionReturn['edgeSettings'];
  setEdgeSettings: UseAdvancedPenSelectionReturn['setEdgeSettings'];
}) {
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadgeAmber}>4</span>
          <span class={styles.cardTitle}>Edge Refinement</span>
        </div>
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderLabelRow}>
          <span class={styles.sliderTitle}>Feather Radius</span>
          <span class={styles.sliderValueBadge}>{edgeSettings.featherRadius} px</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={edgeSettings.featherRadius}
          class={styles.rangeInput}
          onInput={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            setEdgeSettings((prev) => ({ ...prev, featherRadius: val }));
          }}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderLabelRow}>
          <span class={styles.sliderTitle}>Expand / Contract</span>
          <span class={styles.sliderValueBadge}>{edgeSettings.expandContract} px</span>
        </div>
        <input
          type="range"
          min="-20"
          max="20"
          step="1"
          value={edgeSettings.expandContract}
          class={styles.rangeInput}
          onInput={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            setEdgeSettings((prev) => ({ ...prev, expandContract: val }));
          }}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderLabelRow}>
          <span class={styles.sliderTitle}>Smooth Path</span>
          <span class={styles.sliderValueBadge}>{edgeSettings.smoothPath} %</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={edgeSettings.smoothPath}
          class={styles.rangeInput}
          onInput={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            setEdgeSettings((prev) => ({ ...prev, smoothPath: val }));
          }}
        />
      </div>

      <div class={styles.sliderGroup}>
        <div class={styles.sliderLabelRow}>
          <span class={styles.sliderTitle}>Edge Blur</span>
          <span class={styles.sliderValueBadge}>{edgeSettings.edgeBlur} %</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={edgeSettings.edgeBlur}
          class={styles.rangeInput}
          onInput={(e) => {
            const val = Number((e.target as HTMLInputElement).value);
            setEdgeSettings((prev) => ({ ...prev, edgeBlur: val }));
          }}
        />
      </div>
    </div>
  );
}

function Step5ViewCard({
  bgMode,
  setBgMode,
  customColor,
  setCustomColor,
  showOriginal,
  setShowOriginal,
  showMask,
  setShowMask,
}: {
  bgMode: BgMode;
  setBgMode: (m: BgMode) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
  showOriginal: boolean;
  setShowOriginal: (v: boolean) => void;
  showMask: boolean;
  setShowMask: (v: boolean) => void;
}) {
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadgeBlue}>5</span>
          <span class={styles.cardTitle}>View & Background</span>
        </div>
      </div>

      <div class={styles.bgSwatchRow}>
        <button
          type="button"
          class={`${styles.bgSwatchBtn} ${bgMode === 'transparent' ? styles.swatchActive : ''}`}
          onClick={() => setBgMode('transparent')}
          title="Transparent Background"
        >
          <div class={styles.swatchPreviewChecker} />
          <span class={styles.swatchLabel}>Transparent</span>
        </button>
        <button
          type="button"
          class={`${styles.bgSwatchBtn} ${bgMode === 'white' ? styles.swatchActive : ''}`}
          onClick={() => setBgMode('white')}
          title="White Background"
        >
          <div class={styles.swatchPreviewWhite} />
          <span class={styles.swatchLabel}>White</span>
        </button>
        <button
          type="button"
          class={`${styles.bgSwatchBtn} ${bgMode === 'black' ? styles.swatchActive : ''}`}
          onClick={() => setBgMode('black')}
          title="Black Background"
        >
          <div class={styles.swatchPreviewBlack} />
          <span class={styles.swatchLabel}>Black</span>
        </button>
        <button
          type="button"
          class={`${styles.bgSwatchBtn} ${bgMode === 'custom' ? styles.swatchActive : ''}`}
          onClick={() => setBgMode('custom')}
          title="Custom Color"
        >
          <div
            class={styles.swatchPreviewCustom}
            style={{ background: 'linear-gradient(135deg, #f43f5e, #3b82f6, #10b981)' }}
          />
          <span class={styles.swatchLabel}>Custom</span>
        </button>
      </div>

      {bgMode === 'custom' && (
        <div class={styles.customColorPickerRow}>
          <label class={styles.inputLabel} for="custom-bg-input">
            Choose Color:
          </label>
          <input
            id="custom-bg-input"
            type="color"
            value={customColor}
            class={styles.colorInput}
            onInput={(e) => setCustomColor((e.target as HTMLInputElement).value)}
          />
        </div>
      )}

      <div class={styles.previewCheckboxes}>
        <label class={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showOriginal}
            onChange={(e) => setShowOriginal((e.target as HTMLInputElement).checked)}
          />
          <span>Show Original Image</span>
        </label>
        <label class={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showMask}
            onChange={(e) => setShowMask((e.target as HTMLInputElement).checked)}
          />
          <span>Show Selection Mask & Pen Path</span>
        </label>
      </div>
    </div>
  );
}

function Step6ExportCard({
  downloadCutout,
  isProcessing,
}: {
  downloadCutout: (fmt: 'png' | 'webp' | 'svg') => void;
  isProcessing: boolean;
}) {
  return (
    <div class={styles.controlCard}>
      <div class={styles.cardHeader}>
        <div class={styles.stepTitleRow}>
          <span class={styles.stepBadgePurple}>6</span>
          <span class={styles.cardTitle}>Export</span>
        </div>
      </div>

      <button
        type="button"
        class={styles.downloadPngBtn}
        onClick={() => downloadCutout('png')}
        disabled={isProcessing}
      >
        <span class={styles.btnIcon}>📥</span>
        <span>Download PNG</span>
        <span class={styles.btnSubtext}>Transparent Alpha</span>
      </button>

      <div class={styles.exportPillsRow}>
        <button
          type="button"
          class={styles.secondaryExportBtn}
          onClick={() => downloadCutout('webp')}
          disabled={isProcessing}
        >
          Download WebP
        </button>
        <button
          type="button"
          class={styles.secondaryExportBtn}
          onClick={() => downloadCutout('svg')}
          disabled={isProcessing}
        >
          Export Path (SVG)
        </button>
      </div>
    </div>
  );
}

export interface AdvancedPenRightPanelProps {
  penSelection: UseAdvancedPenSelectionReturn;
}

export function AdvancedPenRightPanel({ penSelection }: AdvancedPenRightPanelProps) {
  const {
    edgeSettings,
    setEdgeSettings,
    bgMode,
    setBgMode,
    customColor,
    setCustomColor,
    showOriginal,
    setShowOriginal,
    showMask,
    setShowMask,
    downloadCutout,
    isProcessing,
  } = penSelection;

  return (
    <div class={styles.rightControlsColumn}>
      <Step4EdgeCard edgeSettings={edgeSettings} setEdgeSettings={setEdgeSettings} />
      <Step5ViewCard
        bgMode={bgMode}
        setBgMode={setBgMode}
        customColor={customColor}
        setCustomColor={setCustomColor}
        showOriginal={showOriginal}
        setShowOriginal={setShowOriginal}
        showMask={showMask}
        setShowMask={setShowMask}
      />
      <Step6ExportCard downloadCutout={downloadCutout} isProcessing={isProcessing} />
    </div>
  );
}
