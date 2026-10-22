import { createPortal } from 'preact/compat';
import { useLayoutEffect, useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmCards.module.css';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';

interface Props {
  printable: boolean;
  onVisualization: () => void;
  onUnits: () => void;
}

function Toolbar({
  printable,
  onVisualization,
  onUnits,
  placement,
}: Props & { placement: string }) {
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
        <Icon name="file-output" />
        <span class={s.label}>{t.print}</span>
      </button>
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
    row.insertBefore(element, row.querySelector('.privacy'));
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
