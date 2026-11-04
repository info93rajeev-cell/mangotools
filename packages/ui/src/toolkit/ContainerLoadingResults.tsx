import { Icon } from '../primitives/Icon.tsx';
import { containerAllocation } from './containerAllocation.ts';
import { packageColors } from './containerPlacementGeometry.ts';
import s from './containerResults.module.css';
import type { LoadSnapshot } from './containerWorkspaceModel.ts';
import { loadMoney, packageTitle } from './containerWorkspacePresentation.ts';
import { containerText as t, unloadedReasonText } from './containerWorkspaceStrings.ts';
import { ScrollableItemTable } from './ScrollableItemTable.tsx';
export function ContainerLoadingResults({
  state,
  selected,
}: {
  state: LoadSnapshot;
  selected: number;
}) {
  const r = state.result;
  if (!r)
    return (
      <section class={s.card} aria-label={t.results} aria-busy={state.pending}>
        <p>{state.pending ? t.pending : t.noData}</p>
      </section>
    );
  const weight =
    r.weightStatus === 'complete' && r.maxPayload !== null ? r.weightUtilizationPercent : null;
  return (
    <section class={s.card} aria-labelledby="load-results-title">
      <div class={s.heading}>
        <h2 id="load-results-title">{t.results}</h2>
        <span class={s.loadCount} title={t.overall}>
          <strong data-load-containers="">{r.containersRequired}</strong> {t.containerCount} ·{' '}
          {t.loaded}: {r.loadedPieces} · {t.unloaded}: {r.unloadedPieces}
          {r.weightStatus === 'partial' ? ` · ${t.known}` : ''}
        </span>
        <span class={s.status} data-status={r.status}>
          {r.status === 'complete' ? <Icon name="circle-check" /> : null}
          {t[r.status]}
        </span>
      </div>
      <LoadKpis r={r} />

      {r.weightStatus === 'partial' ? <p class={s.note}>{t.partialWeight}</p> : null}
      <Allocation state={state} selected={selected} />
      <LoadingDetails state={state} />
    </section>
  );
}
const pct = (v: string | null) => Math.max(0, Math.min(100, Number(v ?? 0)));
const trimNum = (v: string) => (v.includes('.') ? v.replace(/\.?0+$/, '') : v);
const group = (v: string) => {
  const [i = '', d] = v.split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${d ? `.${d}` : ''}`;
};

interface Kpi {
  tone: string;
  icon: string;
  label: string;
  value: string;
  sub: string;
  percent: number | null;
  meter: string;
}

function kpisOf(r: NonNullable<LoadSnapshot['result']>): Kpi[] {
  const weightKnown = r.weightStatus === 'complete' && r.loadedWeight !== null;
  const weightPct =
    r.weightStatus === 'complete' && r.maxPayload !== null ? r.weightUtilizationPercent : null;
  const loaded = Number(r.loadedPieces);
  const total = Number(r.totalPieces) || 0;
  return [
    {
      tone: 'green',
      icon: 'box',
      label: t.loadedVolume,
      value: `${trimNum(Number(r.loadedVolume).toFixed(1))} m³`,
      sub: `of ${trimNum((Number(r.containerVolume) * (Number(r.containersRequired) || 1)).toFixed(1))} m³`,
      percent: pct(r.volumeUtilizationPercent),
      meter: `${Math.round(pct(r.volumeUtilizationPercent))}%`,
    },
    {
      tone: 'blue',
      icon: 'box',
      label: t.cargoWeight,
      value: weightKnown ? `${group(trimNum(Number(r.loadedWeight).toFixed(0)))} kg` : t.unknown,
      sub: r.maxPayload ? `Max: ${group(trimNum(r.maxPayload))} kg` : t.noPayload,
      percent: weightPct === null ? null : pct(weightPct),
      meter: weightPct === null ? '' : `${Math.round(pct(weightPct))}%`,
    },
    {
      tone: 'amber',
      icon: 'package',
      label: t.loadedPieces,
      value: group(r.loadedPieces),
      sub: t.totalPiecesSub,
      percent: total > 0 ? (loaded / total) * 100 : 0,
      meter: `${group(r.loadedPieces)} / ${group(r.totalPieces)}`,
    },
    {
      tone: 'red',
      icon: 'package',
      label: t.unloadedPieces,
      value: group(r.unloadedPieces),
      sub: t.remaining,
      percent: total > 0 ? (Number(r.unloadedPieces) / total) * 100 : 0,
      meter: '',
    },
  ];
}

/** The four result cards of the approved reference: icon tile, label, big value, note, meter. */
function LoadKpis({ r }: { r: NonNullable<LoadSnapshot['result']> }) {
  return (
    <div class={s.kpis}>
      {kpisOf(r).map((k, i) => (
        <div key={k.label} class={s.kpi} data-tone={k.tone}>
          <span class={s.kpiIcon}>
            <Icon name={k.icon} />
          </span>
          <span class={s.kpiLabel}>{k.label}</span>
          <strong class={s.kpiValue} data-load-kpi={i}>
            {k.value}
          </strong>
          <span class={s.kpiSub}>{k.sub}</span>
          <span class={s.kpiMeter}>
            <span class={s.kpiTrack}>
              <span style={{ width: `${k.percent ?? 0}%` }} />
            </span>
            {k.meter ? <span class={s.kpiMeterText}>{k.meter}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function Allocation({ state, selected }: { state: LoadSnapshot; selected: number }) {
  const r = state.result;
  if (!r) return null;
  const values = containerAllocation(r, selected);
  return (
    <details
      class={`${s.allocation} ${s.secondary}`}
      open={typeof window !== 'undefined' && window.innerWidth > 700}
    >
      <summary>{t.allocation}</summary>
      <div class={s.bar} aria-hidden="true">
        {r.packages.map((p) => (
          <span
            key={p.index}
            style={{
              background: packageColors[p.index % packageColors.length],
              flexGrow: Number(values[p.index]?.share ?? 0),
            }}
          />
        ))}
      </div>
      <div class={s.legend}>
        {r.packages.map((p) => (
          <div key={p.index}>
            <i style={{ background: packageColors[p.index % packageColors.length] }} />
            <span>
              {packageTitle(state, p.index)}
              <small>
                {p.byContainer[selected] ?? '0'} · {values[p.index]?.volume ?? '0.000'} m³ (
                {values[p.index]?.share ?? '0.0'}%)
              </small>
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
function LoadingDetails({ state }: { state: LoadSnapshot }) {
  return (
    <details
      class={`${s.details} ${s.secondary}`}
      open={typeof window !== 'undefined' && window.innerWidth > 700}
    >
      <summary>
        {t.details} <small>· {t.shipmentTotals}</small>
      </summary>
      <ScrollableItemTable caption={t.details}>
        <thead>
          <tr>
            {[
              t.package,
              t.packageDimensions,
              t.quantity,
              t.loaded,
              t.unloaded,
              t.volumeColumn,
              state.result?.weightStatus === 'complete' ? t.totalWeightColumn : t.weightColumn,
            ].map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.result?.packages.map((p) => (
            <tr key={p.index}>
              <th scope="row">{packageTitle(state, p.index)}</th>
              <td>
                {state.packages[p.index]?.length} × {state.packages[p.index]?.width} ×{' '}
                {state.packages[p.index]?.height} {state.packages[p.index]?.unit}
              </td>
              <td>{p.requested}</td>
              <td>{p.loaded}</td>
              <td>
                {p.unloaded}
                {p.unloadedReason ? (
                  <small>{unloadedReasonText[p.unloadedReason] ?? t.partial}</small>
                ) : null}
              </td>
              <td>{p.loadedVolume}</td>
              <td>{p.loadedWeight ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </ScrollableItemTable>
    </details>
  );
}
export function ContainerFreightResult({ state }: { state: LoadSnapshot }) {
  if (!state.costInput.enabled) return null;
  const cost = state.cost;
  return (
    <section
      class={`${s.card} ${s.costResult}`}
      aria-labelledby="load-freight-title"
      data-cost-result=""
    >
      <h2 id="load-freight-title">{t.freight}</h2>
      {cost ? (
        <>
          <div class={s.freightMeta} data-freight-meta="">
            <span>{t.perContainer}</span>
            <span>
              {t.rate}: {loadMoney(cost.rate, cost.currency)}
            </span>
            <span>
              {t.containers}: {cost.quantity}
            </span>
          </div>
          <div class={s.freightFigures} data-freight-figures="">
            {[
              [t.freightCharge, cost.freightCharge],
              [t.otherCharges, cost.otherCharges],
              [t.total, cost.estimatedTotal],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{loadMoney(value ?? '0', cost.currency)}</strong>
              </div>
            ))}
          </div>
          {cost.minimumApplied ? (
            <p>
              {t.minApplied}: {loadMoney(cost.minimumCharge ?? '0', cost.currency)}
            </p>
          ) : null}
        </>
      ) : (
        <p>{t.costWaiting}</p>
      )}
    </section>
  );
}
