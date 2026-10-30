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
  notify,
  downloadLabel = 'Download',
}: DataStudioStatusBarProps) {
  const handleUtility = (kind: string, label: string) => {
    if (typeof document !== 'undefined') {
      const el = document.querySelector(`details[data-${kind}]`);
      if (el) {
        if (!el.hasAttribute('open')) {
          el.setAttribute('open', '');
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    notify?.(`${label} details expanded below`);
  };

  return (
    <div class={styles.statusBar}>
      <div class={styles.utility}>
        <button
          type="button"
          class={styles.utilityBtn}
          onClick={() => handleUtility('disclaimer', 'Disclaimer')}
          title="Open Disclaimer details"
        >
          &#9432; &nbsp;Disclaimer <b>+</b>
        </button>
        <button
          type="button"
          class={styles.utilityBtn}
          onClick={() => handleUtility('how-to-use', 'How to use')}
          title="Open How to use guide"
        >
          &#128214; &nbsp;How to use <b>+</b>
        </button>
        <button
          type="button"
          class={styles.utilityBtn}
          onClick={() => handleUtility('method', 'Method')}
          title="Open Method details"
        >
          &#9881; &nbsp;Method <b>+</b>
        </button>
        <button
          type="button"
          class={styles.utilityBtn}
          onClick={() => handleUtility('faq', 'FAQ')}
          title="Open FAQ section"
        >
          &#10067; &nbsp;FAQ <b>+</b>
        </button>
        <button
          type="button"
          class={styles.utilityBtn}
          onClick={() => handleUtility('related-tools', 'Related tools')}
          title="Open Related tools list"
        >
          &#9827; &nbsp;Related tools <b>+</b>
        </button>
      </div>

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
