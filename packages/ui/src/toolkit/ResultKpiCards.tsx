import { Icon } from '../primitives/Icon.tsx';
import s from './containerResults.module.css';

/** One result card of the approved Container Loading reference. */
export interface ResultKpi {
  tone: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  icon: string;
  label: string;
  value: string;
  sub: string;
  /** 0–100 for the meter; null hides the fill. */
  percent: number | null;
  /** Text after the meter, e.g. "71%" or "200 / 200". */
  meter: string;
}

/** The row of four result cards: coloured icon, label, large value, note and a meter. */
export function ResultKpiCards({ items, idPrefix }: { items: ResultKpi[]; idPrefix: string }) {
  return (
    <div class={s.kpis}>
      {items.map((k, i) => (
        <div key={k.label} class={s.kpi} data-tone={k.tone}>
          <span class={s.kpiIcon}>
            <Icon name={k.icon} />
          </span>
          <span class={s.kpiLabel}>{k.label}</span>
          <strong class={s.kpiValue} {...{ [`data-${idPrefix}-kpi`]: i }}>
            {k.value}
          </strong>
          <span class={s.kpiSub}>{k.sub}</span>
          <span class={s.kpiMeter}>
            <span class={s.kpiTrack}>
              <span style={{ width: `${Math.max(0, Math.min(100, k.percent ?? 0))}%` }} />
            </span>
            {k.meter ? <span class={s.kpiMeterText}>{k.meter}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A coloured share bar with a legend, as in "Package Allocation in Container". */
export function ShareBar(props: {
  title: string;
  parts: { label: string; color: string; share: number; note: string }[];
}) {
  return (
    <details class={`${s.allocation} ${s.secondary}`} open>
      <summary>{props.title}</summary>
      <div class={s.bar} aria-hidden="true">
        {props.parts.map((p) => (
          <span key={p.label} style={{ background: p.color, flexGrow: Math.max(0, p.share) }} />
        ))}
      </div>
      <div class={s.legend}>
        {props.parts.map((p) => (
          <div key={p.label}>
            <i style={{ background: p.color }} />
            <span>
              {p.label}
              <small>{p.note}</small>
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

/** "Loading Results" card heading with summary line and status pill. */
export function ResultsHeading(props: {
  id: string;
  title: string;
  line: preact.ComponentChildren;
  status: string;
  ok: boolean;
}) {
  return (
    <div class={s.heading}>
      <h2 id={props.id}>{props.title}</h2>
      <span class={s.loadCount}>{props.line}</span>
      <span class={s.status} data-status={props.ok ? 'complete' : 'partial'}>
        {props.ok ? <Icon name="circle-check" /> : null}
        {props.status}
      </span>
    </div>
  );
}

export const resultCardClass = s.card;
export const resultDetailsClass = `${s.details} ${s.secondary}`;
