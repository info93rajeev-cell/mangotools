import { useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import { copyText } from './actions.ts';
import a from './toolActionRow.module.css';

/**
 * The Logistics action row of the approved Container Loading reference: Calculate (primary), then
 * Print / Save PDF and Copy Summary. Results update as inputs change, so Calculate brings the
 * results into view and confirms they are current.
 */
export function ToolActionRow(props: {
  calculateLabel: string;
  resultsId: string;
  ready: boolean;
  summary: string;
  printLabel?: string;
  copyLabel?: string;
}) {
  const [note, setNote] = useState('');
  const calculate = () => {
    const el = document.getElementById(props.resultsId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.setAttribute('data-flash', '');
    setTimeout(() => el?.removeAttribute('data-flash'), 1200);
    setNote(props.ready ? 'Results are up to date.' : 'Complete the inputs to see results.');
  };
  return (
    <div class={a.row}>
      <button type="button" class={a.calc} onClick={calculate}>
        <Icon name="zap" /> {props.calculateLabel}
      </button>
      <button type="button" class={a.print} disabled={!props.ready} onClick={() => window.print()}>
        <Icon name="file-text" /> {props.printLabel ?? 'Print / Save PDF'}
      </button>
      <button
        type="button"
        class={a.copy}
        disabled={!props.ready}
        onClick={async () =>
          setNote((await copyText(props.summary)) ? 'Summary copied.' : 'Copy failed.')
        }
      >
        <Icon name="copy" /> {props.copyLabel ?? 'Copy Summary'}
      </button>
      <p class={a.note} role="status">
        {note}
      </p>
    </div>
  );
}
