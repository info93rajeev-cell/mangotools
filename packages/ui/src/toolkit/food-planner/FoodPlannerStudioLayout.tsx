import { Icon } from '../../primitives/Icon.tsx';
import { CookingScheduleSection } from './CookingScheduleSection.tsx';
import { CostEstimationSection } from './CostEstimationSection.tsx';
import styles from './foodPlanner.module.css';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import { IngredientsSection } from './IngredientsSection.tsx';
import { RecipesMenuSection } from './RecipesMenuSection.tsx';
import { ShoppingListSection } from './ShoppingListSection.tsx';
import { type PlannerSection, type PlanSetupState, useFoodPlanner } from './useFoodPlanner.ts';

export interface FoodPlannerStudioLayoutProps {
  notify?: (msg: string) => void;
}

export function FoodPlannerStudioLayout({ notify }: FoodPlannerStudioLayoutProps) {
  const planner = useFoodPlanner();
  const { activeSection, setActiveSection, setup, setSetup, loadSamplePlan } = planner;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
      notify?.('Plan link copied to clipboard!');
    }
  };

  return (
    <div class={styles.container}>
      <PlannerBreadcrumbs />
      <PlannerTopHeader onLoadSample={loadSamplePlan} onShare={handleShare} />
      <PlannerNavBar activeSection={activeSection} onSelectSection={setActiveSection} />
      <div class={styles.desktopOnly}>
        <PlanSetupCard
          setup={setup}
          onSetSetup={setSetup}
          onUpdate={() => notify?.(`Plan updated for ${setup.guests} guests (${setup.occasion})`)}
        />
      </div>

      {activeSection === 'recipes' && <RecipesMenuSection planner={planner} />}
      {activeSection === 'ingredients' && <IngredientsSection planner={planner} />}
      {activeSection === 'shopping' && <ShoppingListSection planner={planner} />}
      {activeSection === 'cost' && <CostEstimationSection planner={planner} />}
      {activeSection === 'schedule' && <CookingScheduleSection planner={planner} />}
    </div>
  );
}

function PlannerBreadcrumbs() {
  return (
    <nav class={styles.breadcrumb} aria-label="Breadcrumb">
      <a href="/" class={styles.breadcrumbLink}>
        Home
      </a>
      <span class={styles.breadcrumbSep}>&gt;</span>
      <a href="/food-and-catering" class={styles.breadcrumbLink}>
        Food &amp; Catering
      </a>
      <span class={styles.breadcrumbSep}>&gt;</span>
      <span class={styles.breadcrumbActive}>Food Planner</span>
    </nav>
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
          <span class={styles.guidePill}>
            <Icon name="lightbulb" /> Guide
          </span>
        </div>
        <p class={styles.toolSubtitle}>
          Plan recipes, calculate quantities, create ingredient lists, estimate cost and schedule
          your preparation.
        </p>
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
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="setup-loc"
            class={styles.selectInput}
            value={setup.location}
            onChange={(e) =>
              onSetSetup({ ...setup, location: (e.target as HTMLSelectElement).value })
            }
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
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
