import { IconButton } from '../primitives/Button.tsx';
import { Icon } from '../primitives/Icon.tsx';
import { t } from '../strings/en.ts';
import styles from '../toolkit/fileTool.module.css';

export interface QueuedFile {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
}

/** Moves the item at `index` one place toward `direction`, or returns a copy unchanged at an edge. */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  const next = [...items];
  if (target < 0 || target >= items.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item as T);
  return next;
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** Human-readable file size (binary units, one decimal place above KB). */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return unit === 0 ? `${value} ${UNITS[unit]}` : `${value.toFixed(1)} ${UNITS[unit]}`;
}

export interface FileQueueProps {
  queueLabel: string;
  files: QueuedFile[];
  /** The file named in the current error's details, if any, highlighted in the list. */
  problemFileName: string | null;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

/** The reorderable list of queued files: move up/down and remove, all keyboard-operable. */
export function FileQueue({
  queueLabel,
  files,
  problemFileName,
  onRemove,
  onMove,
}: FileQueueProps) {
  if (files.length === 0) return null;
  return (
    <ul class={styles.queue} aria-label={queueLabel}>
      {files.map((file, index) => (
        <li
          key={file.id}
          class={styles.queueRow}
          data-problem={file.name === problemFileName || undefined}
        >
          <Icon name="file-text" />
          <span class={styles.queueName}>{file.name}</span>
          <span class={styles.queueSize}>{formatFileSize(file.size)}</span>
          <div class={styles.queueActions}>
            <IconButton
              size="sm"
              variant="ghost"
              icon="chevron-up"
              label={t('fileTool.moveUp', { name: file.name })}
              disabled={index === 0}
              onClick={() => onMove(file.id, -1)}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon="chevron-down"
              label={t('fileTool.moveDown', { name: file.name })}
              disabled={index === files.length - 1}
              onClick={() => onMove(file.id, 1)}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon="x"
              label={t('fileTool.removeFile', { name: file.name })}
              onClick={() => onRemove(file.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
