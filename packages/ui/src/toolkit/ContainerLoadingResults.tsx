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
  const kpis = [
    [t.pieces, r.totalPieces],
    [t.containers, r.containersRequired],
    [t.volume, `${r.volumeUtilizationPercent}%`],
    [t.weightUsage, weight === null ? t.unknown : `${weight}%`],
  ];
  return (
    <section class={s.card} aria-labelledby="load-results-title">
      <div class={s.heading}>
        <h2 id="load-results-title">{t.results}</h2>
        <span class={s.loadCount} title={t.overall}>
          {t.loaded}: {r.loadedPieces} · {t.unloaded}: {r.unloadedPieces}
          {r.weightStatus === 'partial' ? ` · ${t.known}` : ''}
        </span>
        <span class={s.status} data-status={r.status}>
          {t[r.status]}
        </span>
      </div>
      <div class={s.kpis}>
        {kpis.map(([label, value], i) => (
          <div
            key={label}
            class={s.kpi}
            style={{ '--tone': ['#0eb779', '#0065ff', '#11ad77', '#df9c00'][i] }}
          >
            <Icon name={['box', 'box', 'rotate-ccw', 'weight'][i] ?? 'container'} />
            <span>{label}</span>
            <strong data-load-kpi={i}>{value}</strong>
          </div>
        ))}
      </div>

      {r.weightStatus === 'partial' ? <p class={s.note}>{t.partialWeight}</p> : null}
      <Allocation state={state} selected={selected} />
      <LoadingDetails state={state} />
    </section>
  );
}
function Allocation({ state, selected }: { state: LoadSnapshot; selected: number }) {
  const r = state.result;
  if (!r) return null;
  const values = containerAllocation(r, selected);
  return (
    <details
      class={`${s.allocation} ${s.secondary}`}
      open={typeof window === 'undefined' || window.innerWidth > 700}
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
      open={typeof window === 'undefined' || window.innerWidth > 700}
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
