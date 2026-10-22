import type { ResolvedPreset } from '@mangotools/schemas';
import type { ComponentChildren } from 'preact';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmInputs.module.css';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';
import { cbmWorkbenchText as w } from './cbmWorkbenchStrings.ts';
import { messageFor } from './presentation.ts';

function InfoCard(props: {
  icon: string;
  tone: string | undefined;
  title: string;
  count: number;
  className?: string;
  children: ComponentChildren;
}) {
  return (
    <details class={`${s.panel} ${s.infoCard} ${props.className ?? ''}`}>
      <summary>
        <span class={`${s.infoIcon} ${props.tone ?? ''}`} aria-hidden="true">
          <Icon name={props.icon} />
        </span>
        <span class={s.infoTitle}>{props.title}</span>
        <span class={s.infoCount}>({props.count})</span>
        <Icon name="chevron-down" class={s.chevron} />
      </summary>
      <div class={s.infoBody}>{props.children}</div>
    </details>
  );
}

/** Important notes and warnings, collapsed by default. */
export function CbmNotesPanel({
  warnings,
  preset,
  className = '',
}: {
  className?: string;
  warnings: CbmSnapshot['warnings'];
  preset: ResolvedPreset;
}) {
  const notes = [
    t.formula,
    t.measurement,
    t.fitDisclaimer,
    t.variation,
    `${t.references}: ${t.capacities}. ${t.source} · ${t.sourceDate}`,
    ...warnings.map((warning) => messageFor(preset, warning)),
  ];
  return (
    <InfoCard
      icon="triangle-alert"
      tone={s.toneWarning}
      title={t.notes}
      count={notes.length}
      className={className}
    >
      <ul>
        {notes.map((note, index) => (
          <li key={`${index}-${note}`}>{note}</li>
        ))}
      </ul>
      <a href="/container-loading-calculator">{t.fitLink}</a>
    </InfoCard>
  );
}

const STEPS = [
  ['/container-loading-calculator', w.stepContainer, w.stepContainerNote],
  ['/pallet-loading-calculator', w.stepPallet, w.stepPalletNote],
  ['/volumetric-weight-calculator', w.stepVolumetric, w.stepVolumetricNote],
] as const;

/** Where to go next with the shipment: links to the related logistics calculators. */
export function CbmNextSteps({ className = '' }: { className?: string }) {
  return (
    <InfoCard
      icon="route"
      tone={s.toneInfo}
      title={w.nextSteps}
      count={STEPS.length}
      className={className}
    >
      <ul class={s.steps}>
        {STEPS.map(([href, name, note]) => (
          <li key={href}>
            <a href={href}>{name}</a>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}
