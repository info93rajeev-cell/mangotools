import { useState } from 'preact/hooks';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { MobileMetric, MobilePlanSetup, MobileSectionHeader } from './MobilePlanSetup.tsx';
import { RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface RecipesMobileViewProps {
  planner: UseFoodPlannerReturn;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
  filteredRecipes: UseFoodPlannerReturn['selectedRecipes'];
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (value: number | ((prev: number) => number)) => void;
}

export function RecipesMobileView(props: RecipesMobileViewProps) {
  const { planner } = props;
  const [tab, setTab] = useState<'menu' | 'all' | 'favorites' | 'mine'>('menu');
  const dishes = planner.selectedRecipes;
  const browse = (value: typeof tab) => {
    setTab(value);
    props.setFavoritesOnly(value === 'favorites');
    props.setPage(1);
  };
  return (
    <div class={s.mobileContainer} data-testid="mobile-recipes">
      <MobileSectionHeader title={t.recipes} intro={t.recipesIntro} icon="book-open" />
      <MobilePlanSetup planner={planner} id="mobile-recipes" />
      <div class={s.mobileNavPillsRow}>
        {(
          [
            ['menu', t.menuPlan],
            ['all', t.allRecipes],
            ['favorites', t.favorites],
            ['mine', t.myRecipes],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={value === tab}
            class={`${s.mobileNavPill} ${value === tab ? s.mobileNavPillActive : ''}`}
            onClick={() => browse(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'menu' ? (
        <>
          <SelectedMobileMenu planner={planner} onBrowse={() => browse('all')} />
          <section class={s.mobileCard}>
            <h4 class={s.mobileCardTitle}>{t.summary}</h4>
            <div class={s.mobileSummary2x2}>
              <MobileMetric label={t.dishes} value={dishes.length} icon="utensils" />
              <MobileMetric label={t.guests} value={planner.setup.guests} icon="users" />
              <MobileMetric
                label={t.prep}
                value={`${dishes.reduce((n, r) => n + r.prepMinutes, 0)} min`}
                icon="clock"
              />
              <MobileMetric
                label={t.cook}
                value={`${dishes.reduce((n, r) => n + r.cookMinutes, 0)} min`}
                icon="flame"
              />
            </div>
          </section>
          <div class={s.mobileDualActions}>
            <button
              type="button"
              class={s.mobilePrimaryBtn}
              onClick={() => planner.setActiveSection('schedule')}
            >
              {t.goSchedule}
            </button>
            <button
              type="button"
              class={s.mobileSecondaryBtn}
              onClick={() => planner.setActiveSection('cost')}
            >
              {t.goCost}
            </button>
          </div>
        </>
      ) : tab === 'mine' ? (
        <section class={s.mobileCard}>
          <p>{t.myRecipesNote}</p>
          <button type="button" class={s.mobilePrimaryBtn} onClick={() => browse('all')}>
            {t.allRecipes}
          </button>
        </section>
      ) : (
        <MobileGallery {...props} />
      )}
    </div>
  );
}

function SelectedMobileMenu({
  planner,
  onBrowse,
}: {
  planner: UseFoodPlannerReturn;
  onBrowse: () => void;
}) {
  const dishes = planner.selectedRecipes;
  return (
    <section class={s.mobileCard}>
      <div class={s.mobileCardHeader}>
        <h4 class={s.mobileCardTitle}>
          {t.selectedMenu} ({dishes.length} {t.dishes})
        </h4>
        <button type="button" class={s.mobileEditBtn} onClick={onBrowse}>
          {t.editMenu}
        </button>
      </div>
      {!dishes.length && <p>{t.empty}</p>}
      {dishes.map((dish) => (
        <div class={s.mobileDishItem} key={dish.id}>
          <img
            class={s.mobileDishThumb}
            src={dish.thumbnailUrl}
            alt=""
            title={dish.imageProvenance?.notes}
          />
          <div class={s.mobileDishInfo}>
            <p class={s.mobileDishName}>{dish.name}</p>
            <span class={s.mobileCourseBadge}>{dish.course}</span>
          </div>
          <label class={s.mobileServingsBadge}>
            <input
              type="number"
              min={0.25}
              max={10}
              step={0.25}
              value={planner.portionFactors[dish.id] ?? 1}
              aria-label={`${dish.name} ${t.portionFactor}`}
              onInput={(e) => {
                const value = e.currentTarget.valueAsNumber;
                if (Number.isFinite(value)) planner.setPortionFactor(dish.id, value);
              }}
            />
            {planner.setup.guests * (planner.portionFactors[dish.id] ?? 1)} {t.servings}
          </label>
        </div>
      ))}
    </section>
  );
}

function MobileGallery(props: RecipesMobileViewProps) {
  const { planner } = props;
  return (
    <RecipeGalleryPanel
      searchQuery={planner.searchQuery}
      setSearchQuery={planner.setSearchQuery}
      activeCourse={planner.activeCourse}
      setActiveCourse={planner.setActiveCourse}
      favoritesOnly={props.favoritesOnly}
      setFavoritesOnly={props.setFavoritesOnly}
      favorites={props.favorites}
      toggleFavorite={props.toggleFavorite}
      filteredRecipes={props.filteredRecipes}
      selectedRecipeIds={planner.selectedRecipeIds}
      toggleRecipe={planner.toggleRecipe}
      page={props.page}
      setPage={props.setPage}
      pageSize={props.pageSize}
      setPageSize={props.setPageSize}
    />
  );
}
