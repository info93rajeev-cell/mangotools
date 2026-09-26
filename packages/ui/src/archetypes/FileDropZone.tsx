import { useState } from 'preact/hooks';
import { t } from '../strings/en.ts';
import styles from '../toolkit/fileTool.module.css';

export interface FileDropZoneProps {
  onFiles: (list: FileList | File[]) => void;
}

/** Drag-and-drop target plus a real, keyboard-operable file input as the click-to-browse fallback. */
export function FileDropZone({ onFiles }: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop only; the accessible control is the nested label/input, which works with no drag at all.
    <div
      class={styles.dropZone}
      data-active={dragActive || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        if (event.dataTransfer?.files.length) onFiles(event.dataTransfer.files);
      }}
    >
      <p>{t('fileTool.dropHint')}</p>
      <label class={styles.chooseFiles}>
        {t('fileTool.chooseFiles')}
        <input
          type="file"
          accept="application/pdf"
          multiple
          class={styles.fileInput}
          onChange={(event) => {
            const list = event.currentTarget.files;
            if (list && list.length > 0) onFiles(list);
            event.currentTarget.value = '';
          }}
        />
      </label>
    </div>
  );
}
