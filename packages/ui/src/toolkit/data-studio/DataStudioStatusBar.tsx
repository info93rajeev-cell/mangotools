import { Icon } from '../../primitives/Icon.tsx';
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
          <Icon name="settings-2" class={styles.ico} /> {primaryLabel}
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onCopy}>
          <Icon name="copy" class={styles.ico} /> Copy result
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onDownload}>
          <Icon name="download" class={styles.ico} /> {downloadLabel}
        </button>
        <button type="button" class={styles.btnSecondary} onClick={onReset}>
          <Icon name="rotate-ccw" class={styles.ico} /> Reset
        </button>
      </div>
    </div>
  );
}
