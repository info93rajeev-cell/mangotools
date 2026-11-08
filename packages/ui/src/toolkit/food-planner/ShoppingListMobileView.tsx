import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import {
  DEFAULT_VEGETABLES,
  type DeptGroup,
  MobileDepartmentGroup,
} from './ShoppingListMobileComponents.tsx';
import type { ShoppingLineItem } from './shoppingListUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListMobileViewProps {
  planner: UseFoodPlannerReturn;
  items: ShoppingLineItem[];
  boughtMap: Record<string, boolean>;
  onToggleBought: (id: string) => void;
}

export function ShoppingListMobileView({
  planner,
  items,
  boughtMap,
  onToggleBought,
}: ShoppingListMobileViewProps) {
  const { setup, setSetup } = planner;
  const [filter, setFilter] = useState<'all' | 'tobuy' | 'instock'>('all');
  const [expandedDept, setExpandedDept] = useState<string>('Vegetables');

  const depts = buildDepartmentGroups(items);
  const totalCost = depts.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div class={mobileStyles.mobileContainer}>
      <MobileShoppingHeader />
      <MobileShoppingSetupCard setup={setup} setSetup={setSetup} />
      <MobileShoppingSummary totalCost={totalCost} />
      <MobileShoppingFilters active={filter} onSelect={setFilter} />

      <div>
        {depts.map((dept) => (
          <MobileDepartmentGroup
            key={dept.name}
            dept={dept}
            isExpanded={expandedDept === dept.name}
            onToggle={() => setExpandedDept(expandedDept === dept.name ? '' : dept.name)}
            boughtMap={boughtMap}
            onToggleBought={onToggleBought}
          />
        ))}
      </div>

      <MobileShoppingActions />
    </div>
  );
}

function buildDepartmentGroups(items: ShoppingLineItem[]): DeptGroup[] {
  const vegetables = items.filter((i) => i.aisle === 'produce');
  const grains = items.filter((i) => i.aisle === 'dry-goods');
  const dairy = items.filter((i) => i.aisle === 'dairy');
  const spices = items.filter((i) => i.aisle === 'spices');
  const oils = items.filter((i) => i.aisle === 'bakery' || i.aisle === 'canned');

  return [
    {
      name: 'Vegetables',
      count: vegetables.length || 6,
      cost: 412,
      icon: 'leaf',
      items: vegetables.length > 0 ? vegetables : DEFAULT_VEGETABLES,
    },
    {
      name: 'Pulses & Grains',
      count: grains.length || 4,
      cost: 528,
      icon: 'layers',
      items: grains,
    },
    { name: 'Dairy & Paneer', count: dairy.length || 3, cost: 380, icon: 'coffee', items: dairy },
    {
      name: 'Spices & Condiments',
      count: spices.length || 7,
      cost: 238,
      icon: 'flame',
      items: spices,
    },
    { name: 'Oil & Others', count: oils.length || 4, cost: 114, icon: 'droplet', items: oils },
  ];
}

function MobileShoppingHeader() {
  return (
    <div class={mobileStyles.mobileSectionHeader}>
      <div class={mobileStyles.mobileSectionHeaderIcon}>
        <Icon name="shopping-cart" />
      </div>
      <div>
        <h3 class={mobileStyles.mobileSectionHeaderTitle}>Shopping List</h3>
        <p class={mobileStyles.mobileSectionHeaderSub}>
          Consolidated ingredient list with quantities, cost and shopping status.
        </p>
      </div>
    </div>
  );
}

function MobileShoppingSetupCard({
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-shop-loc">
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="mob-shop-loc"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-shop-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="mob-shop-occ"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-shop-pt">
            <Icon name="layers" /> Planning Type
          </label>
          <select
            id="mob-shop-pt"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-shop-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="mob-shop-guests"
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
        <Icon name="rotate-ccw" /> Update List
      </button>
    </div>
  );
}

function MobileShoppingSummary({ totalCost }: { totalCost: number }) {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="bar-chart-2" />
          <h4 class={mobileStyles.mobileCardTitle}>List Summary</h4>
        </div>
      </div>
      <div class={mobileStyles.mobileMetricsRow}>
        <div
          class={mobileStyles.mobileMetricBox}
          style={{ background: '#fffbeb', borderColor: '#fef3c7' }}
        >
          <Icon name="calendar" />
          <span class={mobileStyles.mobileMetricLabel}>Total Items</span>
          <span class={mobileStyles.mobileMetricValue}>24</span>
        </div>
        <div
          class={mobileStyles.mobileMetricBox}
          style={{ background: '#fff7ed', borderColor: '#ffedd5' }}
        >
          <Icon name="shopping-cart" />
          <span class={mobileStyles.mobileMetricLabel} style={{ color: '#c2410c' }}>
            To Buy
          </span>
          <span class={mobileStyles.mobileMetricValue} style={{ color: '#c2410c' }}>
            18
          </span>
        </div>
        <div
          class={mobileStyles.mobileMetricBox}
          style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}
        >
          <Icon name="check-circle" />
          <span class={mobileStyles.mobileMetricLabel} style={{ color: '#15803d' }}>
            In Stock
          </span>
          <span class={mobileStyles.mobileMetricValue} style={{ color: '#15803d' }}>
            6
          </span>
        </div>
        <div
          class={mobileStyles.mobileMetricBox}
          style={{ background: '#fef9c3', borderColor: '#fef08a' }}
        >
          <Icon name="coins" />
          <span class={mobileStyles.mobileMetricLabel} style={{ color: '#854d0e' }}>
            Est. Total Cost
          </span>
          <span class={mobileStyles.mobileMetricValue} style={{ color: '#854d0e' }}>
            ₹{totalCost}
          </span>
        </div>
      </div>
    </div>
  );
}

function MobileShoppingFilters({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (f: 'all' | 'tobuy' | 'instock') => void;
}) {
  return (
    <div class={mobileStyles.mobileNavPillsRow}>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'all' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('all')}
      >
        All Items (24)
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'tobuy' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('tobuy')}
      >
        🛒 To Buy (18)
      </button>
      <button
        type="button"
        class={`${mobileStyles.mobileNavPill} ${active === 'instock' ? mobileStyles.mobileNavPillActive : ''}`}
        onClick={() => onSelect('instock')}
      >
        ✅ In Stock (6)
      </button>
    </div>
  );
}

function MobileShoppingActions() {
  return (
    <div class={mobileStyles.mobileDualActions}>
      <button type="button" class={mobileStyles.mobilePrimaryBtn}>
        <Icon name="shopping-cart" /> Add Selected to Shopping
      </button>
      <button type="button" class={mobileStyles.mobileSecondaryBtn}>
        <Icon name="share-2" /> Share List
      </button>
    </div>
  );
}
