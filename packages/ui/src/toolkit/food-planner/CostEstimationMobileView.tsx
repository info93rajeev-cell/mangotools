import type { RecipeCostItem } from './CostOtherExpensesCard.tsx';
import { OtherCostsCard } from './CostOtherExpensesCard.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { MobileMetric, MobilePlanSetup, MobileSectionHeader } from './MobilePlanSetup.tsx';
import { money } from './plannerResults.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CostEstimationMobileViewProps {
  planner: UseFoodPlannerReturn;
  recipeCosts: RecipeCostItem[];
  totalIngredientCost: number;
  totalOtherCost: number;
  totalMenuCost: number;
  costPerServing: string | number;
}

export function CostEstimationMobileView(props: CostEstimationMobileViewProps) {
  const {
    planner,
    recipeCosts,
    totalIngredientCost,
    totalOtherCost,
    totalMenuCost,
    costPerServing,
  } = props;
  const highest = [...recipeCosts].sort((a, b) => b.totalDish - a.totalDish)[0];
  const share =
    totalMenuCost > 0 ? Math.round((totalIngredientCost / totalMenuCost) * 1000) / 10 : 0;
  return (
    <div class={s.mobileContainer} data-testid="mobile-cost">
      <MobileSectionHeader title={t.cost} intro={t.costIntro} icon="coins" />
      <MobilePlanSetup planner={planner} id="mobile-cost" />
      {planner.isLoadingCost && <p role="status">{t.calculating}</p>}
      {planner.costError && <p role="alert">{planner.costError}</p>}
      <section class={s.mobileCard}>
        <div class={s.mobileCardHeader}>
          <h4 class={s.mobileCardTitle}>
            {t.selectedDishes} ({recipeCosts.length})
          </h4>
          <strong data-testid="mobile-menu-cost">{money(totalMenuCost)}</strong>
        </div>
        {recipeCosts.map((dish) => (
          <div class={s.mobileDishItem} key={dish.id}>
            <img
              class={s.mobileDishThumb}
              src={planner.selectedRecipes.find((r) => r.id === dish.id)?.thumbnailUrl}
              alt=""
              title={planner.selectedRecipes.find((r) => r.id === dish.id)?.imageProvenance?.notes}
            />
            <div class={s.mobileDishInfo}>
              <p class={s.mobileDishName}>{dish.name}</p>
              <span class={s.mobileServingsBadge}>
                {dish.servings} {t.servings}
              </span>
            </div>
            <strong>{money(dish.totalDish)}</strong>
          </div>
        ))}
      </section>
      <section class={s.mobileCard}>
        <h4 class={s.mobileCardTitle}>{t.costSummary}</h4>
        <div class={s.mobileSummary2x2}>
          <MobileMetric
            label={t.ingredientCost}
            value={money(totalIngredientCost)}
            icon="shopping-basket"
          />
          <MobileMetric label={t.otherCost} value={money(totalOtherCost)} icon="coins" />
          <MobileMetric label={t.totalCost} value={money(totalMenuCost)} icon="utensils" />
          <MobileMetric label={t.perServing} value={money(costPerServing)} icon="users" />
        </div>
        <p class={s.mobileCardSubtitle}>{t.costNote}</p>
      </section>
      <OtherCostsCard
        idPrefix="mobile"
        items={planner.otherCosts}
        totalOtherCost={totalOtherCost}
        onUpdate={planner.updateOtherCost}
      />
      <section class={s.mobileCard}>
        <h4 class={s.mobileCardTitle}>{t.insights}</h4>
        <p>
          {t.ingredientShare}: {share}%
        </p>
        <progress max={100} value={share} aria-label={t.ingredientShare} />
        <p>
          {t.otherShare}: {totalMenuCost ? Math.round((100 - share) * 10) / 10 : 0}%
        </p>
        {highest && (
          <p>
            {t.highest}:{' '}
            <strong>
              {highest.name} ({money(highest.totalDish)})
            </strong>
          </p>
        )}
        <button
          type="button"
          class={s.mobilePrimaryBtn}
          onClick={() => planner.setActiveSection('schedule')}
        >
          {t.goSchedule}
        </button>
      </section>
    </div>
  );
}
