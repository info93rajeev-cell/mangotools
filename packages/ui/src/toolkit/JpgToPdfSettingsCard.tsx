import styles from './jpgToPdfStudio.module.css';
import type {
  FitModeOption,
  MarginsOption,
  OrientationOption,
  PageSizeOption,
} from './usePdfStudioState.ts';

export function JpgToPdfSettingsCard({
  idPrefix,
  pageSize,
  orientation,
  fitMode,
  margins,
  outputFileName,
  onSetPageSize,
  onSetOrientation,
  onSetFitMode,
  onSetMargins,
  onSetOutputFileName,
}: {
  idPrefix: string;
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  fitMode: FitModeOption;
  margins: MarginsOption;
  outputFileName: string;
  onSetPageSize: (v: PageSizeOption) => void;
  onSetOrientation: (v: OrientationOption) => void;
  onSetFitMode: (v: FitModeOption) => void;
  onSetMargins: (v: MarginsOption) => void;
  onSetOutputFileName: (v: string) => void;
}) {
  return (
    <div class={styles.card} data-tour="settings">
      <div class={styles.cardHeader}>
        <div class={styles.cardHeaderLeft}>
          <span class={styles.stepBadgeCircle}>3</span>
          <h2 class={styles.cardTitle}>PDF settings</h2>
        </div>
      </div>

      <div class={styles.settingsGrid}>
        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-page-size`} class={styles.fieldLabel}>
            Page size{' '}
            <span class={styles.helpDot} title="Target document page size">
              ?
            </span>
          </label>
          <select
            id={`${idPrefix}-page-size`}
            class={styles.selectInput}
            value={pageSize}
            onChange={(e) => onSetPageSize((e.target as HTMLSelectElement).value as PageSizeOption)}
          >
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="fit">Fit to image</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-orientation`} class={styles.fieldLabel}>
            Orientation{' '}
            <span class={styles.helpDot} title="Page orientation">
              ?
            </span>
          </label>
          <select
            id={`${idPrefix}-orientation`}
            class={styles.selectInput}
            value={orientation}
            onChange={(e) =>
              onSetOrientation((e.target as HTMLSelectElement).value as OrientationOption)
            }
          >
            <option value="portrait">📱 Portrait</option>
            <option value="landscape">💻 Landscape</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-fit-mode`} class={styles.fieldLabel}>
            Fit mode{' '}
            <span class={styles.helpDot} title="How images scale onto pages">
              ?
            </span>
          </label>
          <select
            id={`${idPrefix}-fit-mode`}
            class={styles.selectInput}
            value={fitMode}
            onChange={(e) => onSetFitMode((e.target as HTMLSelectElement).value as FitModeOption)}
          >
            <option value="fit">⛶ Fit to page</option>
            <option value="fill">Fill page</option>
            <option value="original">Original size</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-margins`} class={styles.fieldLabel}>
            Margins{' '}
            <span class={styles.helpDot} title="Page border margin padding">
              ?
            </span>
          </label>
          <select
            id={`${idPrefix}-margins`}
            class={styles.selectInput}
            value={margins}
            onChange={(e) => onSetMargins((e.target as HTMLSelectElement).value as MarginsOption)}
          >
            <option value="normal">Normal (1 inch)</option>
            <option value="small">Small (0.5 inch)</option>
            <option value="none">None (0)</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-numbering`} class={styles.fieldLabel}>
            Page numbering
          </label>
          <select id={`${idPrefix}-numbering`} class={styles.selectInput} defaultValue="none">
            <option value="none">None</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-page-bg`} class={styles.fieldLabel}>
            Page background
          </label>
          <select id={`${idPrefix}-page-bg`} class={styles.selectInput} defaultValue="white">
            <option value="white">White</option>
            <option value="transparent">Transparent</option>
            <option value="offwhite">Off-white</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-image-quality`} class={styles.fieldLabel}>
            Image quality
          </label>
          <select id={`${idPrefix}-image-quality`} class={styles.selectInput} defaultValue="high">
            <option value="high">High (Original quality)</option>
            <option value="medium">Medium (Compressed)</option>
            <option value="low">Low (Smallest size)</option>
          </select>
        </div>

        <div class={styles.fieldGroup}>
          <label for={`${idPrefix}-filename`} class={styles.fieldLabel}>
            Output file name
          </label>
          <input
            id={`${idPrefix}-filename`}
            type="text"
            class={styles.textInput}
            value={outputFileName}
            onInput={(e) => onSetOutputFileName((e.target as HTMLInputElement).value)}
            placeholder="images.pdf"
          />
        </div>
      </div>
    </div>
  );
}
