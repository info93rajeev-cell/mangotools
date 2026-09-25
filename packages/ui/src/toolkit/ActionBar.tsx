import { Button } from '../primitives/Button.tsx';
import { t } from '../strings/en.ts';
import styles from './toolkit.module.css';

export interface ActionBarProps {
  /** Disabled until there is a result to act on. */
  hasResult: boolean;
  onCopy?: (() => void) | undefined;
  onDownload?: (() => void) | undefined;
  onPrint?: (() => void) | undefined;
  onReset: () => void;
}

/** Copy · Download · Print · Reset — only the actions that make sense for the tool. */
export function ActionBar({ hasResult, onCopy, onDownload, onPrint, onReset }: ActionBarProps) {
  return (
    <div class={`${styles.actionBar} no-print`}>
      {onCopy ? (
        <Button icon="copy" onClick={onCopy} disabled={!hasResult}>
          {t('action.copyResult')}
        </Button>
      ) : null}
      {onDownload ? (
        <Button icon="download" onClick={onDownload} disabled={!hasResult}>
          {t('action.download')}
        </Button>
      ) : null}
      {onPrint ? (
        <Button icon="printer" onClick={onPrint} disabled={!hasResult}>
          {t('action.print')}
        </Button>
      ) : null}
      <Button variant="ghost" icon="rotate-ccw" onClick={onReset}>
        {t('action.reset')}
      </Button>
    </div>
  );
}
