import type { ResolvedPreset } from '@mangotools/schemas';
import s from './cbmInputs.module.css';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { messageFor } from './presentation.ts';

export function CbmNotesPanel({
  warnings,
  preset,
}: {
  warnings: CbmSnapshot['warnings'];
  preset: ResolvedPreset;
}) {
  return (
    <details class={`${s.panel} ${s.notes}`}>
      <summary>{t.notes}</summary>
      <p>{t.formula}</p>
      <p>{t.measurement}</p>
      {warnings.map((warning, index) => (
        <p key={`${warning.code}-${index}`}>{messageFor(preset, warning)}</p>
      ))}
      <details>
        <summary>{t.references}</summary>
        <p>{t.capacities}</p>
        <p>
          {t.source} · {t.sourceDate}
        </p>
        <p>{t.fitDisclaimer}</p>
        <p>{t.variation}</p>
        <a href="/container-loading-calculator">{t.fitLink}</a>
      </details>
    </details>
  );
}
