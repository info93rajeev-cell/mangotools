import { useState } from 'preact/hooks';
import { Button } from '../primitives/Button.tsx';
import { copyText } from './actions.ts';
import s from './cbmResults.module.css';
import { cbmText as t } from './cbmStrings.ts';

/** Output actions: Print / Save PDF is primary, Copy Summary secondary. Behaviour is unchanged. */
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
      <div class={`${s.actions} ${className}`}>
        <Button
          variant="primary"
          size="lg"
          icon="printer"
          class={s.print}
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
