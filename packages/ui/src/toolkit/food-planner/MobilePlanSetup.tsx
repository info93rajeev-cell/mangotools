import { Icon } from '../../primitives/Icon.tsx';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import {
  CULINARY_REGIONS,
  getCulinaryRegion,
  getOccasionsForRegion,
  isUSLocation,
  LOCATIONS,
  PLANNING_TYPES,
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

function applyMobileRecommendation(
  planner: UseFoodPlannerReturn,
  location: string,
  occasion: string,
  country?: 'IN' | 'US',
) {
  const isUS = isUSLocation(location, country);
  const recommended = recommendMenu({
    country: isUS ? 'US' : 'IN',
    location,
    occasion,
    mealType: planner.setup.mealType ?? 'Dinner',
    diet: planner.setup.diet,
    guests: planner.setup.guests,
    availableRecipes: planner.allRecipes,
  });
  if (recommended.length > 0) {
    planner.setSelectedRecipeIds(new Set(recommended.map((r) => r.id)));
  }
}

function handleMobileLocationChange(val: string, planner: UseFoodPlannerReturn) {
  const { setup, setSetup } = planner;
  const isUS = isUSLocation(val, setup.country);
  const region = getCulinaryRegion(val);
  const newOccasion = region.occasions.includes(setup.occasion)
    ? setup.occasion
    : region.defaultOccasion;
  const updated = {
    ...setup,
    location: val,
    occasion: newOccasion,
    country: (isUS ? 'US' : 'IN') as 'IN' | 'US',
  };
  setSetup(updated);
  applyMobileRecommendation(planner, val, newOccasion, updated.country);
}

function handleMobileFieldChange(key: string, val: string, planner: UseFoodPlannerReturn) {
  const { setup, setSetup } = planner;
  if (key === 'guests') {
    setSetup({ ...setup, guests: Number(val) || 20 });
    return;
  }
  if (key === 'location') {
    handleMobileLocationChange(val, planner);
    return;
  }
  if (key === 'occasion') {
    setSetup({ ...setup, occasion: val });
    applyMobileRecommendation(planner, setup.location, val, setup.country);
    return;
  }
  setSetup({ ...setup, [key]: val });
}

function handleMobilePlanUpdate(planner: UseFoodPlannerReturn) {
  applyMobileRecommendation(
    planner,
    planner.setup.location,
    planner.setup.occasion,
    planner.setup.country,
  );
  planner.setSetup({ ...planner.setup });
}

export function MobilePlanSetup({ planner, id }: { planner: UseFoodPlannerReturn; id: string }) {
  const { setup } = planner;
  const occasions = getOccasionsForRegion(setup.location);
  const fields = [
    { key: 'location' as const, label: t.cuisineRegion, options: LOCATIONS },
    { key: 'occasion' as const, label: t.occasion, options: occasions },
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
              {field.key === 'location'
                ? CULINARY_REGIONS.map((reg) => (
                    <option key={reg.id} value={reg.name}>
                      {reg.name}
                    </option>
                  ))
                : field.options.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
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
            onChange={(e) => handleMobileFieldChange('guests', e.currentTarget.value, planner)}
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
