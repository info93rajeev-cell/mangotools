import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { computeAutoBalancedPortions } from './cateringPortions.ts';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_GALLERY_RECIPES, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { MobileMetric, MobilePlanHeader } from './MobilePlanSetup.tsx';
import { PersonalRecipes } from './PersonalRecipes.tsx';
import { RecipeDetailDialog } from './RecipeDetailDialog.tsx';
import { RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import { isRecipeEligibleForLocation } from './RecipesMenuSection.tsx';
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
  const [detailRecipe, setDetailRecipe] = useState<ExtendedFoodRecipe | null>(null);
  const dishes = planner.selectedRecipes;
  const browse = (value: typeof tab) => {
    setTab(value);
    props.setFavoritesOnly(value === 'favorites');
    props.setPage(1);
  };

  return (
    <div class={s.mobileContainer} data-testid="mobile-recipes">
      <MobilePlanHeader planner={planner} section="recipes" />
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
          <SelectedMobileMenu
            planner={planner}
            onBrowse={() => browse('all')}
            onViewRecipe={(dish) => setDetailRecipe(dish)}
          />
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
        <PersonalRecipes planner={planner} />
      ) : (
        <MobileGallery {...props} onViewRecipe={(dish) => setDetailRecipe(dish)} />
      )}

      <RecipeDetailDialog
        recipe={detailRecipe}
        servings={planner.setup.guests * (planner.portionFactors[detailRecipe?.id ?? ''] ?? 1)}
        onClose={() => setDetailRecipe(null)}
      />
    </div>
  );
}

function SelectedMobileMenu({
  planner,
  onBrowse,
  onViewRecipe,
}: {
  planner: UseFoodPlannerReturn;
  onBrowse: () => void;
  onViewRecipe: (dish: ExtendedFoodRecipe) => void;
}) {
  const dishes = planner.selectedRecipes;

  const handleAutoBalance = () => {
    const balanced = computeAutoBalancedPortions(dishes);
    for (const [id, factor] of Object.entries(balanced)) {
      planner.setPortionFactor(id, factor);
    }
  };

  return (
    <section class={s.mobileCard}>
      <div class={s.mobileCardHeader}>
        <h4 class={s.mobileCardTitle}>
          {t.selectedMenu} ({dishes.length} {t.dishes})
        </h4>
        <div class={s.mobileMenuActionsCluster}>
          {dishes.length > 1 && (
            <button
              type="button"
              class={s.mobileAutoBalanceBtn}
              onClick={handleAutoBalance}
              title="Auto balance portions"
            >
              <Icon name="sparkles" /> Auto Balance
            </button>
          )}
          {dishes.length > 0 && (
            <button
              type="button"
              class={s.mobileClearAllBtn}
              onClick={planner.clearAllRecipes}
              title="Clear all recipes"
              aria-label="Clear all recipes"
            >
              <Icon name="trash-2" />
            </button>
          )}
          <button type="button" class={s.mobileEditBtn} onClick={onBrowse}>
            {t.editMenu}
          </button>
        </div>
      </div>
      {!dishes.length && <p>{t.empty}</p>}
      {dishes.map((dish) => (
        <MobileDishItem key={dish.id} dish={dish} planner={planner} onViewRecipe={onViewRecipe} />
      ))}
    </section>
  );
}

function MobileDishItem({
  dish,
  planner,
  onViewRecipe,
}: {
  dish: ExtendedFoodRecipe;
  planner: UseFoodPlannerReturn;
  onViewRecipe: (dish: ExtendedFoodRecipe) => void;
}) {
  const factor = planner.portionFactors[dish.id] ?? 1;
  const servings = Math.round(planner.setup.guests * factor);
  return (
    <div class={s.mobileDishItem} key={dish.id}>
      <button
        type="button"
        class={s.mobileDishThumbBtn}
        onClick={() => onViewRecipe(dish)}
        aria-label={`${t.viewRecipe}: ${dish.name}`}
        title={`${t.viewRecipe}: ${dish.name}`}
      >
        <img
          class={s.mobileDishThumb}
          src={dish.thumbnailUrl || '/food/recipes/besan-ladoo.jpg'}
          alt=""
          title={dish.imageProvenance?.notes}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
          }}
        />
        <span class={s.mobileDishPlayBadge} aria-hidden="true">
          ▶
        </span>
      </button>
      <div class={s.mobileDishInfo}>
        <button
          type="button"
          class={s.mobileDishTitleBtn}
          onClick={() => onViewRecipe(dish)}
          title={`${t.viewRecipe}: ${dish.name}`}
        >
          {dish.name}
        </button>
        <div class={s.mobileDishMetaRow}>
          <span class={s.mobileCourseBadge} data-course={dish.course}>
            {dish.course}
          </span>
          <button
            type="button"
            class={s.mobileViewRecipeTextBtn}
            onClick={() => onViewRecipe(dish)}
            title={`${t.viewRecipe}: ${dish.name}`}
          >
            ▶ {t.viewRecipe}
          </button>
        </div>
      </div>
      <div class={s.mobileDishControls}>
        <div class={s.mobilePortionStepper}>
          <input
            type="number"
            min={0.25}
            max={10}
            step={0.25}
            value={factor}
            aria-label={`${dish.name} ${t.portionFactor}`}
            class={s.mobileHiddenSpinbutton}
            onInput={(e) => {
              const val = e.currentTarget.valueAsNumber;
              if (Number.isFinite(val)) planner.setPortionFactor(dish.id, val);
            }}
          />
          <button
            type="button"
            class={s.mobileStepperBtn}
            aria-label={`Decrease portion for ${dish.name}`}
            onClick={() => planner.setPortionFactor(dish.id, Math.max(0.25, factor - 0.25))}
          >
            −
          </button>
          <div class={s.mobileStepperInfo}>
            <span class={s.mobileStepperCount}>{servings}</span>
            <span class={s.mobileStepperUnit}>{t.servings}</span>
            {factor !== 1 && (
              <span class={s.mobileStepperPercent}>{Math.round(factor * 100)}%</span>
            )}
          </div>
          <button
            type="button"
            class={s.mobileStepperBtn}
            aria-label={`Increase portion for ${dish.name}`}
            onClick={() => planner.setPortionFactor(dish.id, factor + 0.25)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          class={s.mobileDishRemoveBtn}
          aria-label={`Remove ${dish.name} from menu`}
          title={`Remove ${dish.name}`}
          onClick={() => planner.toggleRecipe(dish.id)}
        >
          <Icon name="trash-2" />
        </button>
      </div>
    </div>
  );
}

function MobileGallery(
  props: RecipesMobileViewProps & { onViewRecipe?: (dish: ExtendedFoodRecipe) => void },
) {
  const { planner, onViewRecipe } = props;
  return (
    <RecipeGalleryPanel
      catalogRecipes={[...CATALOG_GALLERY_RECIPES, ...planner.personalRecipes].filter((r) =>
        isRecipeEligibleForLocation(r, planner.setup.location, planner.setup.country),
      )}
      searchQuery={planner.searchQuery}
      setSearchQuery={planner.setSearchQuery}
      activeCourse={planner.activeCourse}
      setActiveCourse={planner.setActiveCourse}
      activeDiet={planner.activeDiet}
      setActiveDiet={planner.setActiveDiet}
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
      guests={planner.setup.guests}
      portionFactors={planner.portionFactors}
      onViewRecipe={onViewRecipe}
    />
  );
}
