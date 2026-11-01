import styles from './dataStudio.module.css';

export interface DataStudioStatusBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
  notify?: (msg: string) => void;
  downloadLabel?: string;
}

export function DataStudioStatusBar({
  primaryLabel,
  onPrimary,
  onCopy,
  onDownload,
  onReset,
  notify: _notify,
  downloadLabel = 'Download',
}: DataStudioStatusBarProps) {
  return (
    <div class={styles.statusBar}>
      <div class={styles.callto}>
        <button type="button" class={styles.btnGold} onClick={onPrimary}>
          &#10024; {primaryLabel}
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onCopy}>
          Copy result
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onDownload}>
          {downloadLabel}
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
