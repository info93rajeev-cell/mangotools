import s from './cbmResults.module.css';
import type { CbmSnapshot } from './cbmShipmentModel.ts';
import { cbmText as t } from './cbmStrings.ts';

export function CbmCostResult({ state }: { state: CbmSnapshot }) {
  return (
    <div class={s.costResult}>
      <CostResultContent state={state} />
    </div>
  );
}

function CostResultContent({ state }: { state: CbmSnapshot }) {
  if (!state.costInput.enabled) return null;
  const cost = state.cost;
  return (
    <section class={s.panel} aria-labelledby="cbm-cost-result-title" aria-live="polite">
      <h2 id="cbm-cost-result-title">{t.costTitle}</h2>
      {cost ? (
        <dl class={s.metrics}>
          <div>
            <dt>{t.base}</dt>
            <dd>
              {cost.currency} {cost.baseCharge}
            </dd>
          </div>
          <div>
            <dt>{t.minimumApplied}</dt>
            <dd>{cost.minimumApplied ? t.yes : t.no}</dd>
          </div>
          <div>
            <dt>{t.freight}</dt>
            <dd>
              {cost.currency} {cost.freightCharge}
            </dd>
          </div>
          <div>
            <dt>{t.otherCharges}</dt>
            <dd>
              {cost.currency} {cost.otherCharges}
            </dd>
          </div>
          <div class={s.primary}>
            <dt>{t.total}</dt>
            <dd>
              {cost.currency} {cost.estimatedTotal}
            </dd>
          </div>
        </dl>
      ) : (
        <p>{t.unavailable}</p>
      )}
      <p>{t.costDisclaimer}</p>
    </section>
  );
}
