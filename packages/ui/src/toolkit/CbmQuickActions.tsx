import { createPortal } from 'preact/compat';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { copyText } from './actions.ts';
import s from './cbmCards.module.css';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';

interface Props {
  printable: boolean;
  summary: string;
  onVisualization: () => void;
  onUnits: () => void;
}

/** Phone-only overflow menu from the reference ("…"): Copy Summary. */
function MoreMenu({ printable, summary }: Props) {
  const [open, setOpen] = useState(false);
  const [message, notify] = useState('');
  return (
    <div class={s.more}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="cbm-more-menu"
        onClick={() => setOpen(!open)}
      >
        <Icon name="ellipsis" />
        <span class={s.label}>{w.more}</span>
      </button>
      {open ? (
        <div id="cbm-more-menu" class={s.menu}>
          <button
            type="button"
            disabled={!printable}
            onClick={async () => {
              notify((await copyText(summary)) ? t.copied : t.copyFailed);
              setOpen(false);
            }}
          >
            <Icon name="copy" />
            {t.copy}
          </button>
        </div>
      ) : null}
      <span class="visually-hidden" role="status">
        {message}
      </span>
    </div>
  );
}

function Toolbar(props: Props & { placement: string }) {
  const { printable, onVisualization, onUnits, placement } = props;
  return (
    <fieldset class={s.quickActions} data-placement={placement} aria-label={w.toolbar}>
      <button type="button" onClick={onVisualization}>
        <Icon name="box" />
        <span class={s.label}>{w.toolbar3d}</span>
      </button>
      <button type="button" onClick={onUnits}>
        <Icon name="refresh-cw" />
        <span class={s.label}>{w.toolbarUnits}</span>
      </button>
      <button type="button" disabled={!printable} onClick={() => window.print()}>
        <Icon name={placement === 'title' ? 'file-output' : 'printer'} />
        <span class={s.label}>{t.print}</span>
      </button>
      {placement === 'title' ? null : <MoreMenu {...props} />}
    </fieldset>
  );
}

/** The title row of the shared tool header, where the desktop toolbar sits beside the H1. */
function useTitleRowSlot(): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const row = document.querySelector('.tool-header .title-row');
    if (!row) return;
    const element = document.createElement('div');
    element.className = s.titleSlot ?? '';
    row.append(element);
    setSlot(element);
    return () => element.remove();
  }, []);
  return slot;
}

/** Quick actions: beside the page title on desktop, an icon row above the workspace on phones. */
export function CbmQuickActions(props: Props) {
  const slot = useTitleRowSlot();
  return (
    <>
      {slot ? createPortal(<Toolbar {...props} placement="title" />, slot) : null}
      <Toolbar {...props} placement={slot ? 'phone' : 'inline'} />
    </>
  );
}
