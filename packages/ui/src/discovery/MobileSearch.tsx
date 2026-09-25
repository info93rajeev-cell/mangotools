import { useEffect, useRef, useState } from 'preact/hooks';
import { IconButton } from '../primitives/Button.tsx';
import { t } from '../strings/en.ts';
import styles from './mobile-search.module.css';
import { SearchBox } from './SearchBox.tsx';

/**
 * Header search for narrow screens, where the inline header search is hidden. A modal <dialog>
 * gives focus trapping, an inert page behind it and Escape handling in every browser.
 */
export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (open && el && !el.open) el.showModal();
  }, [open]);

  const close = () => dialog.current?.close();
  const onClose = () => {
    setOpen(false);
    trigger.current?.querySelector('button')?.focus();
  };
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === dialog.current) close();
  };
  /** Keeps Tab inside the dialog (browsers otherwise move focus out to their own toolbar). */
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialog.current) return;
    const items = dialog.current.querySelectorAll<HTMLElement>('input, button');
    const first = items[0];
    const last = items[items.length - 1];
    const edge = event.shiftKey ? first : last;
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  };

  return (
    <div class={styles.root}>
      <span ref={trigger}>
        <IconButton
          variant="ghost"
          icon="search"
          label={t('search.open')}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          data-mobile-search-open=""
        />
      </span>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click only; Escape and the close button cover keyboards. */}
      <dialog
        ref={dialog}
        class={styles.dialog}
        aria-label={t('search.label')}
        onClose={onClose}
        onClick={onBackdrop}
        onKeyDown={onKeyDown}
        data-mobile-search=""
      >
        {open ? (
          <div class={styles.panel}>
            <div class={styles.search}>
              <SearchBox idPrefix="mobile-search" compact onDismiss={close} />
            </div>
            <IconButton variant="ghost" icon="x" label={t('search.close')} onClick={close} />
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
