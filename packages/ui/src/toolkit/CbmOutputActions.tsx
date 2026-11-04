import { useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { copyText } from './actions.ts';
import s from './cbmResults.module.css';
import { cbmText as t } from './cbmStrings.ts';

/** Output actions: Calculate (primary, shows the current results), Print / Save PDF, Copy Summary. */
export function CbmOutputActions({
  summary,
  enabled,
  className = '',
  feedbackClassName = '',
}: {
  summary: string;
  enabled: boolean;
  className?: string;
  feedbackClassName?: string;
}) {
  const [message, notify] = useState('');
  return (
    <>
      <div class={`${s.actions} ${className}`} data-cbm-actions="">
        <Button
          variant="primary"
          size="lg"
          icon="zap"
          class={s.print}
          onClick={() => {
            const el = document.getElementById('cbm-summary-title');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            notify(enabled ? t.calcDone : t.calcIncomplete);
          }}
        >
          {t.calculate}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon="file-text"
          class={s.copy}
          disabled={!enabled}
          onClick={() => window.print()}
        >
          {t.print}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon="copy"
          class={s.copy}
          disabled={!enabled}
          onClick={async () => notify((await copyText(summary)) ? t.copied : t.copyFailed)}
        >
          {t.copy}
        </Button>
      </div>
      <p class={`${s.feedback} ${feedbackClassName}`} role="status">
        {message}
      </p>
    </>
  );
}

export function CbmPrintReport({ summary }: { summary: string }) {
  return (
    <section class={s.report}>
      <h2>{t.branding}</h2>
      <pre>{summary}</pre>
      <p>{t.fitDisclaimer}</p>
      <p>{t.variation}</p>
    </section>
  );
}
