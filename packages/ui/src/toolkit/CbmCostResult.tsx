import { Icon } from '../primitives/Icon.tsx';
import { formatAmount, freightView } from './cbmResultFormat.ts';
import { fillText, cbmResultText as r } from './cbmResultStrings.ts';
import s from './cbmResults.module.css';
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
    <dl class={s.costGrid}>
      <div class={s.costItem}>
        <dt>{freight.label}</dt>
        <dd class={s.costValue}>{freight.value}</dd>
        {freight.note ? <dd class={s.costNote}>{freight.note}</dd> : null}
      </div>
      <div class={s.costItem}>
        <dt>{r.otherCharges}</dt>
        <dd class={s.costValue}>{formatAmount(cost.otherCharges, cost.currency)}</dd>
      </div>
      <div class={s.costTotal} data-cost-total="">
        <dt>{r.estimatedTotal}</dt>
        <dd>{formatAmount(cost.estimatedTotal, cost.currency)}</dd>
      </div>
    </dl>
  );
}

/** Highlighted founder-style result card. Only the current, validated estimate is ever shown. */
function CostResultContent({ state }: { state: CbmSnapshot }) {
  if (!state.costInput.enabled) return null;
  const cost = state.cost;
  return (
    <section class={s.costCard} aria-labelledby="cbm-cost-result-title" aria-busy={!cost}>
      <div class={s.cardHead}>
        <h2 id="cbm-cost-result-title" class={s.title}>
          {t.costTitle}
        </h2>
        {cost ? (
          <span class={s.badge}>
            <Icon name="circle-check" />
            {r.calculated}
          </span>
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
