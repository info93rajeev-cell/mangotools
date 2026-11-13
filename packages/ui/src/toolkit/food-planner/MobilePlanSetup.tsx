import { Icon } from '../../primitives/Icon.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import {
  INDIAN_LOCATIONS,
  LOCATIONS,
  OCCASIONS,
  PLANNING_TYPES,
  US_LOCATIONS,
} from './foodReferenceData.ts';
import { recommendMenu } from './plannerMenuRecommendation.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export function MobileSectionHeader({
  title,
  intro,
  icon,
}: {
  title: string;
  intro: string;
  icon: string;
}) {
  return (
    <header class={s.mobileSectionHeader}>
      <div class={s.mobileSectionHeaderIcon}>
        <Icon name={icon} />
      </div>
      <div>
        <h3 class={s.mobileSectionHeaderTitle}>{title}</h3>
        <p class={s.mobileSectionHeaderSub}>{intro}</p>
      </div>
    </header>
  );
}

function handleMobileFieldChange(key: string, val: string, planner: UseFoodPlannerReturn) {
  const { setup, setSetup } = planner;
  if (key === 'location') {
    const isUS =
      val.includes('United States') || val.includes('New York') || val.includes('Los Angeles');
    const updated = {
      ...setup,
      location: val,
      country: (isUS ? 'US' : 'IN') as 'IN' | 'US',
    };
    setSetup(updated);
    const recommended = recommendMenu({
      country: isUS ? 'US' : 'IN',
      occasion: updated.occasion,
      mealType: updated.mealType ?? 'Dinner',
      diet: updated.diet,
      guests: updated.guests,
      availableRecipes: planner.allRecipes,
    });
    if (recommended.length > 0) {
      planner.setSelectedRecipeIds(new Set(recommended.map((r) => r.id)));
    }
    return;
  }
  setSetup({ ...setup, [key]: val });
}

function handleMobilePlanUpdate(planner: UseFoodPlannerReturn) {
  const { setup, setSetup } = planner;
  const isUS =
    setup.country === 'US' ||
    setup.location?.includes('United States') ||
    setup.location?.includes('New York') ||
    setup.location?.includes('Los Angeles');
  const recommended = recommendMenu({
    country: isUS ? 'US' : 'IN',
    occasion: setup.occasion,
    mealType: setup.mealType ?? 'Dinner',
    diet: setup.diet,
    guests: setup.guests,
    availableRecipes: planner.allRecipes,
  });
  if (recommended.length > 0) {
    planner.setSelectedRecipeIds(new Set(recommended.map((r) => r.id)));
  }
  setSetup({ ...setup });
}

export function MobilePlanSetup({ planner, id }: { planner: UseFoodPlannerReturn; id: string }) {
  const { setup, setSetup } = planner;
  const fields = [
    { key: 'location' as const, label: t.location, options: LOCATIONS },
    { key: 'occasion' as const, label: t.occasion, options: OCCASIONS },
    { key: 'planningType' as const, label: t.planningType, options: PLANNING_TYPES },
  ];
  return (
    <section class={s.mobileSetupCard}>
      <h4 class={s.mobileSetupTitle}>
        <Icon name="calendar" />
        {t.setup}
      </h4>
      <div class={s.mobileSetupGrid}>
        {fields.map((field) => (
          <div class={s.mobileSetupField} key={field.key}>
            <label class={s.mobileFieldLabel} for={`${id}-${field.key}`}>
              {field.label}
            </label>
            <select
              id={`${id}-${field.key}`}
              class={s.mobileSelect}
              value={setup[field.key]}
              onChange={(e) => handleMobileFieldChange(field.key, e.currentTarget.value, planner)}
            >
              {field.key === 'location' ? (
                <>
                  <optgroup label="India">
                    {INDIAN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="United States">
                    {US_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : (
                field.options.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))
              )}
            </select>
          </div>
        ))}
        <div class={s.mobileSetupField}>
          <label class={s.mobileFieldLabel} for={`${id}-guests`}>
            {t.guests}
          </label>
          <select
            id={`${id}-guests`}
            class={s.mobileSelect}
            value={setup.guests}
            onChange={(e) => setSetup({ ...setup, guests: Number(e.currentTarget.value) })}
          >
            {[10, 20, 50, 100, 250, 500].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        class={s.mobileUpdateBtn}
        onClick={() => handleMobilePlanUpdate(planner)}
      >
        <Icon name="refresh-cw" />
        {t.update}
      </button>
    </section>
  );
}

export function MobileMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div class={s.mobileSummaryTile}>
      <Icon name={icon} />
      <div>
        <p class={s.mobileSummaryTileLabel}>{label}</p>
        <p class={s.mobileSummaryTileValue}>{value}</p>
      </div>
    </div>
  );
}

export function MobilePagination({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (page: number) => void;
}) {
  return (
    <nav class={s.mobileDualActions} aria-label={t.page}>
      <button
        type="button"
        class={s.mobileSecondaryBtn}
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        {t.previous}
      </button>
      <button
        type="button"
        class={s.mobileSecondaryBtn}
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
      >
        {t.next}
      </button>
      <span>
        {t.page} {page} / {pages}
      </span>
    </nav>
  );
}

export function MobilePlanHeader({
  planner,
  section,
}: {
  planner: UseFoodPlannerReturn;
  section: 'recipes' | 'ingredients' | 'shopping' | 'cost' | 'schedule';
}) {
  const [title, intro, icon] = {
    recipes: [t.recipes, t.recipesIntro, 'book-open'],
    ingredients: [t.ingredients, t.ingredientsIntro, 'leaf'],
    shopping: [t.shopping, t.shoppingIntro, 'shopping-cart'],
    cost: [t.cost, t.costIntro, 'coins'],
    schedule: [t.schedule, t.scheduleIntro, 'calendar'],
  }[section];
  return (
    <section class={s.mobileHero}>
      <MobileSectionHeader title={title} intro={intro} icon={icon} />
      <MobilePlanSetup planner={planner} id={`mobile-${section}`} />
    </section>
  );
}
