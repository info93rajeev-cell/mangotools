import { useState } from 'preact/hooks';
import { OtherCostsCard } from './CostOtherExpensesCard.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { money } from './plannerResults.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function MobileOtherCosts({ planner }: { planner: UseFoodPlannerReturn }) {
  const [editing, setEditing] = useState(false);
  const labels: Record<string, string> = {
    'cooking-fuel': t.fuel,
    packaging: t.packaging,
    'extra-oil-ghee': t.extraOil,
    'misc-spices': t.misc,
    labour: t.labour,
  };
  return (
    <section class={s.mobileCard}>
      <div class={s.mobileCardHeader}>
        <h4 class={s.mobileCardTitle}>{t.otherCosts}</h4>
        <button
          type="button"
          class={s.mobileEditBtn}
          aria-label={t.editOtherCosts}
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          {editing ? t.cancel : t.edit}
        </button>
      </div>
      {editing ? (
        <OtherCostsCard
          idPrefix="mobile"
          items={planner.otherCosts}
          totalOtherCost={planner.totalOtherCost}
          onUpdate={planner.updateOtherCost}
        />
      ) : (
        <dl class={s.mobileOtherCostList}>
          {planner.otherCosts
            .filter((item) => item.enabled)
            .map((item) => (
              <div key={item.id}>
                <dt>{labels[item.id] ?? item.label}</dt>
                <dd>{money(item.cost)}</dd>
              </div>
            ))}
        </dl>
      )}
    </section>
  );
}
