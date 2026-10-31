import { useRef } from 'preact/hooks';
import styles from './dataStudio.module.css';

interface JsonTopActionBarProps {
  onSample: () => void;
  onOpenFile: (e: Event) => void;
  onPaste: () => void;
  onClearAll: () => void;
}

export function JsonTopActionBar({
  onSample,
  onOpenFile,
  onPaste,
  onClearAll,
}: JsonTopActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div class={styles.topActionsBar}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json,text/plain"
        class={styles.hiddenFileInput}
        onChange={onOpenFile}
        tabIndex={-1}
      />
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={onSample}
        data-try-sample=""
        title="Load default sample JSON"
      >
        <span class={styles.btnIcon}>📄</span> Sample JSON
      </button>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={() => fileInputRef.current?.click()}
        title="Open JSON file from device"
      >
        <span class={styles.btnIcon}>📂</span> Open File
      </button>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={onPaste}
        title="Paste from clipboard"
      >
        <span class={styles.btnIcon}>📋</span> Paste from Clipboard
      </button>
      <button
        type="button"
        class={`${styles.topActionBtn} ${styles.btnDangerOutline}`}
        onClick={onClearAll}
        title="Clear all content"
      >
        <span class={styles.btnIcon}>🗑️</span> Clear All
      </button>
    </div>
  );
}
