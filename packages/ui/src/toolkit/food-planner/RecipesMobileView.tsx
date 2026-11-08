import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';
import { LOCATIONS, OCCASIONS } from './foodReferenceData.ts';
import { RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface RecipesMobileViewProps {
  planner: UseFoodPlannerReturn;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (f: boolean) => void;
  filteredRecipes: ReturnType<UseFoodPlannerReturn['selectedRecipes']['slice']>;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (s: number | ((prev: number) => number)) => void;
}

const COURSE_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'main-course': { bg: '#fee2e2', text: '#991b1b', label: 'Main Course' },
  snack: { bg: '#fef3c7', text: '#92400e', label: 'Snack' },
  sweet: { bg: '#fce7f3', text: '#9d174d', label: 'Dessert' },
  dessert: { bg: '#fce7f3', text: '#9d174d', label: 'Dessert' },
  rice: { bg: '#dcfce7', text: '#166534', label: 'Rice' },
  accompaniment: { bg: '#ede9fe', text: '#5b21b6', label: 'Accompaniment' },
  beverage: { bg: '#e0f2fe', text: '#075985', label: 'Beverage' },
};

export function RecipesMobileView(props: RecipesMobileViewProps) {
  const { planner, filteredRecipes, page, setPage, pageSize, setPageSize } = props;
  const {
    selectedRecipes,
    selectedRecipeIds,
    toggleRecipe,
    setup,
    setSetup,
    searchQuery,
    setSearchQuery,
    activeCourse,
    setActiveCourse,
    setActiveSection,
  } = planner;

  const [mobileTab, setMobileTab] = useState<'menu-plan' | 'all-recipes' | 'favorites'>(
    'menu-plan',
  );

  return (
    <div class={mobileStyles.mobileContainer}>
      <MobileSectionHeader />
      <MobileSetupCard
        setup={setup}
        setSetup={setSetup}
        onUpdate={() => setMobileTab('menu-plan')}
      />
      <MobileNavPills
        activeTab={mobileTab}
        onSelect={(tab) => {
          if (tab === 'favorites') {
            props.setFavoritesOnly(true);
            setMobileTab('all-recipes');
          } else {
            setMobileTab(tab);
          }
        }}
      />

      {mobileTab === 'menu-plan' ? (
        <>
          <MobileSelectedMenuCard
            dishes={selectedRecipes}
            guests={setup.guests}
            onEdit={() => setMobileTab('all-recipes')}
          />
          <MobileMenuSummaryCard dishesCount={selectedRecipes.length} guests={setup.guests} />
          <MobileActionButtons
            onGoSchedule={() => setActiveSection('schedule')}
            onGoCost={() => setActiveSection('cost')}
          />
        </>
      ) : (
        <RecipeGalleryPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCourse={activeCourse}
          setActiveCourse={setActiveCourse}
          favoritesOnly={props.favoritesOnly}
          setFavoritesOnly={props.setFavoritesOnly}
          favorites={props.favorites}
          toggleFavorite={props.toggleFavorite}
          filteredRecipes={filteredRecipes}
          selectedRecipeIds={selectedRecipeIds}
          toggleRecipe={toggleRecipe}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      )}
    </div>
  );
}

function MobileSectionHeader() {
  return (
    <div class={mobileStyles.mobileSectionHeader}>
      <div class={mobileStyles.mobileSectionHeaderIcon}>
        <Icon name="book-open" />
      </div>
      <div>
        <h3 class={mobileStyles.mobileSectionHeaderTitle}>Recipes &amp; Menu</h3>
        <p class={mobileStyles.mobileSectionHeaderSub}>
          Browse, plan and customize recipes and menus for your event.
        </p>
      </div>
    </div>
  );
}

function MobileSetupCard({
  setup,
  setSetup,
  onUpdate,
}: {
  setup: UseFoodPlannerReturn['setup'];
  setSetup: UseFoodPlannerReturn['setSetup'];
  onUpdate: () => void;
}) {
  return (
    <div class={mobileStyles.mobileSetupCard}>
      <div class={mobileStyles.mobileSetupTitle}>
        <Icon name="calendar" />
        <span>Plan Setup</span>
      </div>
      <div class={mobileStyles.mobileSetupGrid}>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-loc">
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="mob-loc"
            class={mobileStyles.mobileSelect}
            value={setup.location}
            onChange={(e) =>
              setSetup({ ...setup, location: (e.target as HTMLSelectElement).value })
            }
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="mob-occ"
            class={mobileStyles.mobileSelect}
            value={setup.occasion}
            onChange={(e) =>
              setSetup({ ...setup, occasion: (e.target as HTMLSelectElement).value })
            }
          >
            {OCCASIONS.map((occ) => (
              <option key={occ} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-type">
            <Icon name="layers" /> Menu Type
          </label>
          <select
            id="mob-type"
            class={mobileStyles.mobileSelect}
            value={setup.planningType}
            onChange={(e) =>
              setSetup({ ...setup, planningType: (e.target as HTMLSelectElement).value })
            }
          >
            <option value="Festival Menu">Festival Menu</option>
            <option value="Standard Buffet">Standard Buffet</option>
            <option value="Executive Lunch">Executive Lunch</option>
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="mob-guests"
            class={mobileStyles.mobileSelect}
            value={setup.guests}
            onChange={(e) =>
              setSetup({ ...setup, guests: Number((e.target as HTMLSelectElement).value) || 20 })
            }
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      <button type="button" class={mobileStyles.mobileUpdateBtn} onClick={onUpdate}>
        <Icon name="rotate-ccw" /> Update Menu
      </button>
    </div>
  );
}

function MobileNavPills({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (tab: 'menu-plan' | 'all-recipes' | 'favorites') => void;
}) {
  return (
    <div class={mobileStyles.mobileNavPillsRow}>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${activeTab === 'menu-plan' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('menu-plan')}
      >
        <Icon name="calendar" /> Menu Plan
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${activeTab === 'all-recipes' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('all-recipes')}
      >
        <Icon name="chef-hat" /> All Recipes
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${activeTab === 'favorites' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('favorites')}
      >
        <Icon name="heart" /> Favorites
      </button>
    </div>
  );
}

function MobileSelectedMenuCard({
  dishes,
  guests,
  onEdit,
}: {
  dishes: UseFoodPlannerReturn['selectedRecipes'];
  guests: number;
  onEdit: () => void;
}) {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="utensils" />
          <h4 class={mobileStyles.mobileCardTitle}>Selected Menu ({dishes.length} Dishes)</h4>
        </div>
        <button type="button" class={mobileStyles.mobileEditBtn} onClick={onEdit}>
          <Icon name="edit-3" /> Edit Menu
        </button>
      </div>

      <div>
        {dishes.map((dish) => {
          const badge = COURSE_BADGE_STYLES[dish.course] ?? {
            bg: '#f1f5f9',
            text: '#475569',
            label: dish.course,
          };
          return (
            <div key={dish.id} class={mobileStyles.mobileDishItem}>
              <img
                src={(dish as { imageUrl?: string }).imageUrl || '/food/recipes/dal-tadka.jpg'}
                alt={dish.name}
                class={mobileStyles.mobileDishThumb}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/food/recipes/dal-tadka.jpg';
                }}
              />
              <div class={mobileStyles.mobileDishInfo}>
                <p class={mobileStyles.mobileDishName}>{dish.name}</p>
                <div class={mobileStyles.mobileDishMeta}>
                  <span
                    class={mobileStyles.mobileCourseBadge}
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                  <span class={mobileStyles.mobileServingsBadge}>
                    <Icon name="users" /> {guests} servings
                  </span>
                </div>
              </div>
              <span class={mobileStyles.mobileDishChevron}>&gt;</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileMenuSummaryCard({ dishesCount, guests }: { dishesCount: number; guests: number }) {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="bar-chart-2" />
          <h4 class={mobileStyles.mobileCardTitle}>Menu Summary</h4>
        </div>
      </div>
      <div class={mobileStyles.mobileMetricsRow}>
        <div class={mobileStyles.mobileMetricBox}>
          <Icon name="utensils" />
          <span class={mobileStyles.mobileMetricLabel}>Total Dishes</span>
          <span class={mobileStyles.mobileMetricValue}>{dishesCount}</span>
        </div>
        <div class={mobileStyles.mobileMetricBox}>
          <Icon name="users" />
          <span class={mobileStyles.mobileMetricLabel}>Total Servings</span>
          <span class={mobileStyles.mobileMetricValue}>{guests}</span>
        </div>
        <div class={mobileStyles.mobileMetricBox}>
          <Icon name="clock" />
          <span class={mobileStyles.mobileMetricLabel}>Prep Time</span>
          <span class={mobileStyles.mobileMetricValue}>1 hr 25 min</span>
        </div>
        <div class={mobileStyles.mobileMetricBox}>
          <Icon name="flame" />
          <span class={mobileStyles.mobileMetricLabel}>Cook Time</span>
          <span class={mobileStyles.mobileMetricValue}>55 min</span>
        </div>
      </div>
    </div>
  );
}

function MobileActionButtons({
  onGoSchedule,
  onGoCost,
}: {
  onGoSchedule: () => void;
  onGoCost: () => void;
}) {
  return (
    <div class={mobileStyles.mobileDualActions}>
      <button type="button" class={mobileStyles.mobilePrimaryBtn} onClick={onGoSchedule}>
        <Icon name="calendar" /> View Cooking Schedule
      </button>
      <button type="button" class={mobileStyles.mobileSecondaryBtn} onClick={onGoCost}>
        <Icon name="coins" /> View Cost Estimation
      </button>
    </div>
  );
}
