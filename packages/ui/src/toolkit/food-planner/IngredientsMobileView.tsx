import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import { FALLBACK_MOBILE_INGREDIENTS, MobileIngredientsTable } from './IngredientsMobileTable.tsx';
import type { IngredientLineItem } from './ingredientsUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface IngredientsMobileViewProps {
  planner: UseFoodPlannerReturn;
  items: IngredientLineItem[];
}

export function IngredientsMobileView({ planner, items }: IngredientsMobileViewProps) {
  const { setup, setSetup } = planner;
  const [filterCat, setFilterCat] = useState<'all' | 'veg' | 'grain' | 'dairy'>('all');
  const [search, setSearch] = useState('');
  const displayItems = items.length > 0 ? items : FALLBACK_MOBILE_INGREDIENTS;

  return (
    <div class={mobileStyles.mobileContainer}>
      <MobileIngredientsHeader />
      <MobileIngredientsSetupCard setup={setup} setSetup={setSetup} />
      <MobileIngredientsSearch search={search} onSearch={setSearch} />
      <MobileIngredientsFilterPills active={filterCat} onSelect={setFilterCat} />
      <MobileIngredientsTable items={displayItems} />
      <MobileIngredientsSummary totalCount={displayItems.length} />
      <MobileIngredientsActions />
    </div>
  );
}

function MobileIngredientsHeader() {
  return (
    <div class={mobileStyles.mobileSectionHeader}>
      <div class={mobileStyles.mobileSectionHeaderIcon}>
        <Icon name="leaf" />
      </div>
      <div>
        <h3 class={mobileStyles.mobileSectionHeaderTitle}>Ingredients</h3>
        <p class={mobileStyles.mobileSectionHeaderSub}>
          Manage, add and organize ingredients with units, price and stock.
        </p>
      </div>
    </div>
  );
}

function MobileIngredientsSetupCard({
  setup,
  setSetup,
}: {
  setup: UseFoodPlannerReturn['setup'];
  setSetup: UseFoodPlannerReturn['setSetup'];
}) {
  return (
    <div class={mobileStyles.mobileSetupCard}>
      <div class={mobileStyles.mobileSetupTitle}>
        <Icon name="calendar" />
        <span>Plan Setup</span>
      </div>
      <div class={mobileStyles.mobileSetupGrid}>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-ing-loc">
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="mob-ing-loc"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-ing-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="mob-ing-occ"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-ing-pt">
            <Icon name="layers" /> Planning Type
          </label>
          <select
            id="mob-ing-pt"
            class={mobileStyles.mobileSelect}
            value={setup.planningType}
            onChange={(e) =>
              setSetup({ ...setup, planningType: (e.target as HTMLSelectElement).value })
            }
          >
            {PLANNING_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
        <div class={mobileStyles.mobileSetupField}>
          <label class={mobileStyles.mobileFieldLabel} for="mob-ing-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="mob-ing-guests"
            class={mobileStyles.mobileSelect}
            value={setup.guests}
            onChange={(e) =>
              setSetup({ ...setup, guests: Number((e.target as HTMLSelectElement).value) || 20 })
            }
          >
            <option value="10">20</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      <button type="button" class={mobileStyles.mobileUpdateBtn}>
        <Icon name="rotate-ccw" /> Update Ingredients
      </button>
    </div>
  );
}

function MobileIngredientsSearch({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (s: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="text"
          placeholder="Search ingredients..."
          value={search}
          onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8' }}>🔍</span>
      </div>
      <button
        type="button"
        style={{
          padding: '8px 12px',
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        + Add Ingredient
      </button>
    </div>
  );
}

function MobileIngredientsFilterPills({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (c: 'all' | 'veg' | 'grain' | 'dairy') => void;
}) {
  return (
    <div class={mobileStyles.mobileNavPillsRow}>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'all' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('all')}
      >
        All (28)
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'veg' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('veg')}
      >
        🥬 Vegetables (8)
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'grain' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('grain')}
      >
        🌾 Grains (4)
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'dairy' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('dairy')}
      >
        🥛 Dairy (3)
      </button>
    </div>
  );
}

function MobileIngredientsSummary({ totalCount }: { totalCount: number }) {
  return (
    <div class={mobileStyles.mobileMetricsRow}>
      <div
        class={mobileStyles.mobileMetricBox}
        style={{ background: '#fffbeb', borderColor: '#fef3c7' }}
      >
        <Icon name="calendar" />
        <span class={mobileStyles.mobileMetricLabel}>Total Items</span>
        <span class={mobileStyles.mobileMetricValue}>{totalCount}</span>
      </div>
      <div
        class={mobileStyles.mobileMetricBox}
        style={{ background: '#fee2e2', borderColor: '#fecaca' }}
      >
        <Icon name="shopping-cart" />
        <span class={mobileStyles.mobileMetricLabel} style={{ color: '#b91c1c' }}>
          Low Stock
        </span>
        <span class={mobileStyles.mobileMetricValue} style={{ color: '#b91c1c' }}>
          3
        </span>
      </div>
      <div
        class={mobileStyles.mobileMetricBox}
        style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}
      >
        <Icon name="check-circle" />
        <span class={mobileStyles.mobileMetricLabel} style={{ color: '#15803d' }}>
          In Stock
        </span>
        <span class={mobileStyles.mobileMetricValue} style={{ color: '#15803d' }}>
          22
        </span>
      </div>
      <div
        class={mobileStyles.mobileMetricBox}
        style={{ background: '#fef9c3', borderColor: '#fef08a' }}
      >
        <Icon name="coins" />
        <span class={mobileStyles.mobileMetricLabel} style={{ color: '#854d0e' }}>
          Est. Value
        </span>
        <span class={mobileStyles.mobileMetricValue} style={{ color: '#854d0e' }}>
          ₹3,460
        </span>
      </div>
    </div>
  );
}

function MobileIngredientsActions() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      <button
        type="button"
        class={mobileStyles.mobilePrimaryBtn}
        style={{ fontSize: '11.5px', padding: '8px 4px' }}
      >
        <Icon name="rotate-ccw" /> Update Stock
      </button>
      <button
        type="button"
        class={mobileStyles.mobileSecondaryBtn}
        style={{ fontSize: '11.5px', padding: '8px 4px' }}
      >
        <Icon name="upload" /> Import / Export
      </button>
      <button
        type="button"
        class={mobileStyles.mobileSecondaryBtn}
        style={{ fontSize: '11.5px', padding: '8px 4px' }}
      >
        <Icon name="layers" /> Add Category
      </button>
    </div>
  );
}
