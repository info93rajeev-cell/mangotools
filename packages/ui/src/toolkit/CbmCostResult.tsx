import { useState } from 'preact/hooks';
import { Icon } from '../primitives/Icon.tsx';
import s from './cbmCostResult.module.css';
import { formatAmount, freightView } from './cbmResultFormat.ts';
import { fillText, cbmResultText as r } from './cbmResultStrings.ts';
import type { CbmSnapshot, CbmCostResult as CostResult } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';

/** Always-present slot for the cost estimate result; empty while the optional estimate is off. */
export function CbmCostResult({
  state,
  className = '',
}: {
  state: CbmSnapshot;
  className?: string;
}) {
  return (
    <div class={className}>
      <CostResultContent state={state} />
    </div>
  );
}

function waitingText(state: CbmSnapshot): string {
  if (state.costError) return t.unavailable;
  return state.shipment ? r.costPending : r.costWaiting;
}

function CostFigures({ cost }: { cost: CostResult }) {
  const freight = freightView(cost);
  return (
    <dl class={s.figures}>
      <div class={s.item}>
        <dt>{freight.label}</dt>
        <dd class={s.value}>{freight.value}</dd>
        {freight.note ? <dd class={s.note}>{freight.note}</dd> : null}
      </div>
      <div class={s.item}>
        <dt>{r.otherCharges}</dt>
        <dd class={s.value}>{formatAmount(cost.otherCharges, cost.currency)}</dd>
      </div>
      <div class={s.total} data-cost-total="">
        <dt>{r.estimatedTotal}</dt>
        <dd>{formatAmount(cost.estimatedTotal, cost.currency)}</dd>
      </div>
    </dl>
  );
}

/** Founder-style yellow result card. Only the current, validated estimate is ever shown. */
function CostResultContent({ state }: { state: CbmSnapshot }) {
  const [open, setOpen] = useState(false);
  if (!state.costInput.enabled) return null;
  const cost = state.cost;
  return (
    <section
      class={s.card}
      aria-labelledby="cbm-cost-result-title"
      aria-busy={!cost}
      data-open={open}
    >
      <div class={s.head}>
        <h2 id="cbm-cost-result-title" class={s.title}>
          {t.costTitle}
        </h2>
        {cost ? (
          <span class={s.badge}>
            <Icon name="circle-check" />
            {r.calculated}
          </span>
        ) : null}
        {cost ? (
          <button
            type="button"
            class={s.toggle}
            aria-expanded={open}
            aria-label={r.breakdown}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'chevron-up' : 'chevron-right'} />
          </button>
        ) : null}
      </div>
      {cost ? <CostFigures cost={cost} /> : <p class={s.empty}>{waitingText(state)}</p>}
      <p class="visually-hidden" role="status">
        {cost
          ? fillText(r.costAnnounce, { total: formatAmount(cost.estimatedTotal, cost.currency) })
          : ''}
      </p>
      <p class={s.disclaimer}>{t.costDisclaimer}</p>
    </section>
  );
}
