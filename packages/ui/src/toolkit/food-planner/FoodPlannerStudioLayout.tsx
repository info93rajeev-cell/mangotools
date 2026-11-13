import { Icon } from '../../primitives/Icon.tsx';
import { CookingScheduleSection } from './CookingScheduleSection.tsx';
import { CostEstimationSection } from './CostEstimationSection.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import {
  CULINARY_REGIONS,
  type ExtendedFoodRecipe,
  isUSLocation,
  OCCASIONS,
  PLANNING_TYPES,
} from './foodReferenceData.ts';
import { IngredientsSection } from './IngredientsSection.tsx';
import { getDefaultOtherExpenses } from './plannerCurrency.ts';
import { recommendMenu } from './plannerMenuRecommendation.ts';
import { RecipesMenuSection } from './RecipesMenuSection.tsx';
import { ShoppingListSection } from './ShoppingListSection.tsx';
import {
  type PlannerSection,
  type PlanSetupState,
  type UseFoodPlannerReturn,
  useFoodPlanner,
} from './useFoodPlanner.ts';

export interface FoodPlannerStudioLayoutProps {
  notify?: (msg: string) => void;
}

export { isUSLocation };

function applyCountryDefaults(
  isUS: boolean,
  updated: PlanSetupState,
  planner: UseFoodPlannerReturn,
) {
  const newCurrency = isUS ? 'USD' : 'INR';
  const expenses = getDefaultOtherExpenses(newCurrency);
  planner.setOtherCosts(
    expenses.map((e) => ({
      id: e.id,
      label: e.name,
      defaultCost: e.amount,
      cost: e.amount,
      enabled: true,
    })),
  );
  planner.setTargetBudget(isUS ? '250' : '2500');

  const recommended = recommendMenu({
    country: isUS ? 'US' : 'IN',
    location: updated.location,
    occasion: updated.occasion,
    mealType: updated.mealType ?? 'Dinner',
    diet: updated.diet,
    guests: updated.guests,
    availableRecipes: planner.allRecipes,
  });
  if (recommended.length > 0) {
    planner.setSelectedRecipeIds(new Set(recommended.map((r) => r.id)));
  }
}

function useSetupPlanHandlers(planner: UseFoodPlannerReturn, notify?: (msg: string) => void) {
  const { setup, setSetup, selectedRecipes, portionFactors, allRecipes, setSelectedRecipeIds } =
    planner;

  const handleShare = async () => {
    const text = [
      t.recipes,
      `${t.guests}: ${setup.guests}`,
      setup.location,
      setup.occasion,
      ...selectedRecipes.map(
        (recipe: ExtendedFoodRecipe) =>
          `${recipe.name}: ${setup.guests * (portionFactors[recipe.id] ?? 1)} ${t.servings}`,
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      notify?.(t.shared);
    } catch {
      notify?.(t.shareError);
    }
  };

  const handleSetSetup = (next: PlanSetupState) => {
    const prevLocation = setup.location;
    const prevIsUS = isUSLocation(setup.location, setup.country);
    const nextIsUS = isUSLocation(next.location, next.country);
    const updated: PlanSetupState = { ...next, country: nextIsUS ? 'US' : 'IN' };
    setSetup(updated);

    if (prevLocation !== next.location || prevIsUS !== nextIsUS) {
      applyCountryDefaults(nextIsUS, updated, planner);
    }
  };

  const handleUpdatePlan = () => {
    const isUS = isUSLocation(setup.location, setup.country);
    const recommended = recommendMenu({
      country: isUS ? 'US' : 'IN',
      location: setup.location,
      occasion: setup.occasion,
      mealType: setup.mealType ?? 'Dinner',
      diet: setup.diet,
      guests: setup.guests,
      availableRecipes: allRecipes,
    });
    if (recommended.length > 0) {
      setSelectedRecipeIds(new Set(recommended.map((r) => r.id)));
    }
    notify?.(`Plan updated for ${setup.guests} guests in ${setup.location} (${setup.occasion})`);
  };

  return { handleShare, handleSetSetup, handleUpdatePlan };
}

export function FoodPlannerStudioLayout({ notify }: FoodPlannerStudioLayoutProps) {
  const planner = useFoodPlanner();
  const { activeSection, setActiveSection, setup, loadSamplePlan } = planner;
  const { handleShare, handleSetSetup, handleUpdatePlan } = useSetupPlanHandlers(planner, notify);

  return (
    <div class={styles.container}>
      <PlannerTopHeader onLoadSample={loadSamplePlan} onShare={() => void handleShare()} />
      <PlannerNavBar activeSection={activeSection} onSelectSection={setActiveSection} />
      <div class={styles.desktopOnly}>
        <PlanSetupCard setup={setup} onSetSetup={handleSetSetup} onUpdate={handleUpdatePlan} />
      </div>

      {activeSection === 'recipes' && <RecipesMenuSection planner={planner} />}
      {activeSection === 'ingredients' && <IngredientsSection planner={planner} />}
      {activeSection === 'shopping' && <ShoppingListSection planner={planner} />}
      {activeSection === 'cost' && <CostEstimationSection planner={planner} />}
      {activeSection === 'schedule' && <CookingScheduleSection planner={planner} />}
    </div>
  );
}

function PlannerTopHeader({
  onLoadSample,
  onShare,
}: {
  onLoadSample: () => void;
  onShare: () => void;
}) {
  return (
    <div class={styles.topHeader}>
      <div class={styles.titleArea}>
        <div class={styles.titleRow}>
          <div class={styles.headerIcon}>
            <Icon name="chef-hat" />
          </div>
          <h2 class={styles.toolTitle}>Food Planner</h2>
          <button
            type="button"
            class={styles.guidePill}
            onClick={() =>
              document
                .querySelector<HTMLButtonElement>('.tool-header [data-guide-trigger]')
                ?.click()
            }
          >
            <Icon name="lightbulb" /> Guide
          </button>
        </div>
        <p class={styles.toolSubtitle}>{t.plannerIntro}</p>
      </div>
      <div class={styles.headerActions}>
        <button type="button" class={styles.actionBtn} onClick={onLoadSample}>
          <Icon name="layers" /> Sample Plan
        </button>
        <button type="button" class={styles.actionBtn} onClick={() => window.print()}>
          <Icon name="printer" /> Print / Save PDF
        </button>
        <button type="button" class={styles.actionBtn} onClick={onShare}>
          <Icon name="share-2" /> Share
        </button>
      </div>
    </div>
  );
}

function PlannerNavBar({
  activeSection,
  onSelectSection,
}: {
  activeSection: PlannerSection;
  onSelectSection: (s: PlannerSection) => void;
}) {
  return (
    <div class={styles.navPillBar} role="tablist" style={{ overflowX: 'auto' }}>
      <NavTab
        id="recipes"
        label="Recipes & Menu"
        mobileLabel="Recipes"
        icon="utensils"
        active={activeSection === 'recipes'}
        onClick={() => onSelectSection('recipes')}
      />
      <NavTab
        id="ingredients"
        label="Ingredients"
        mobileLabel="Ingredients"
        icon="leaf"
        active={activeSection === 'ingredients'}
        onClick={() => onSelectSection('ingredients')}
      />
      <NavTab
        id="shopping"
        label="Shopping List"
        mobileLabel="Shopping"
        icon="shopping-cart"
        active={activeSection === 'shopping'}
        onClick={() => onSelectSection('shopping')}
      />
      <NavTab
        id="cost"
        label="Cost Estimation"
        mobileLabel="Cost"
        icon="coins"
        active={activeSection === 'cost'}
        onClick={() => onSelectSection('cost')}
      />
      <NavTab
        id="schedule"
        label="Cooking Schedule"
        mobileLabel="Cooking Schedule"
        icon="calendar"
        active={activeSection === 'schedule'}
        onClick={() => onSelectSection('schedule')}
      />
    </div>
  );
}

function PlanSetupCard({
  setup,
  onSetSetup,
  onUpdate,
}: {
  setup: PlanSetupState;
  onSetSetup: (s: PlanSetupState) => void;
  onUpdate: () => void;
}) {
  return (
    <div class={styles.planSetupCard}>
      <div class={styles.planSetupHeader}>
        <Icon name="calendar" />
        <span>Plan Setup</span>
        <span class={styles.planSetupHeaderSub}>Tell us about your plan</span>
      </div>
      <div class={styles.planSetupControls}>
        <div class={styles.setupField}>
          <label class={styles.fieldLabel} for="setup-loc">
            <Icon name="globe" /> {t.cuisineRegion}
          </label>
          <select
            id="setup-loc"
            class={styles.selectInput}
            value={setup.location}
            onChange={(e) =>
              onSetSetup({ ...setup, location: (e.target as HTMLSelectElement).value })
            }
          >
            {CULINARY_REGIONS.map((region) => (
              <option key={region.id} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
        <div class={styles.setupField}>
          <label class={styles.fieldLabel} for="setup-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="setup-occ"
            class={styles.selectInput}
            value={setup.occasion}
            onChange={(e) =>
              onSetSetup({ ...setup, occasion: (e.target as HTMLSelectElement).value })
            }
          >
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>
        <div class={styles.setupField}>
          <label class={styles.fieldLabel} for="setup-type">
            <Icon name="layers" /> Planning Type
          </label>
          <select
            id="setup-type"
            class={styles.selectInput}
            value={setup.planningType}
            onChange={(e) =>
              onSetSetup({ ...setup, planningType: (e.target as HTMLSelectElement).value })
            }
          >
            {PLANNING_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
        <div class={styles.setupField}>
          <label class={styles.fieldLabel} for="setup-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="setup-guests"
            class={styles.selectInput}
            value={setup.guests}
            onChange={(e) =>
              onSetSetup({ ...setup, guests: Number((e.target as HTMLSelectElement).value) || 20 })
            }
          >
            <option value="10">10 Guests</option>
            <option value="20">20 Guests</option>
            <option value="50">50 Guests</option>
            <option value="100">100 Guests</option>
            <option value="250">250 Guests</option>
            <option value="500">500 Guests</option>
          </select>
        </div>
        <button type="button" class={styles.updatePlanBtn} onClick={onUpdate}>
          <Icon name="rotate-ccw" /> Update Plan
        </button>
      </div>
    </div>
  );
}

function NavTab({
  id: _id,
  label,
  mobileLabel,
  icon,
  active,
  onClick,
}: {
  id: PlannerSection;
  label: string;
  mobileLabel?: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      class={`${styles.navPill} ${active ? styles.navPillActive : ''}`}
      onClick={onClick}
    >
      <Icon name={icon} />
      <span class={styles.desktopTabLabel}>{label}</span>
      {mobileLabel && <span class={styles.mobileTabLabel}>{mobileLabel}</span>}
    </button>
  );
}
