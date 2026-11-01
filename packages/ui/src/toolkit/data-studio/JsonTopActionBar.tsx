import { useRef } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
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
        <Icon name="file-braces" class={styles.ico} /> Sample JSON
      </button>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={() => fileInputRef.current?.click()}
        title="Open JSON file from device"
      >
        <Icon name="folder-open" class={styles.ico} /> Open File
      </button>
      <button
        type="button"
        class={styles.topActionBtn}
        onClick={onPaste}
        title="Paste from clipboard"
      >
        <Icon name="clipboard-paste" class={styles.ico} /> Paste from Clipboard
      </button>
      <button
        type="button"
        class={`${styles.topActionBtn} ${styles.btnDangerOutline}`}
        onClick={onClearAll}
        title="Clear all content"
      >
        <Icon name="trash-2" class={styles.ico} /> Clear All
      </button>
    </div>
  );
}
