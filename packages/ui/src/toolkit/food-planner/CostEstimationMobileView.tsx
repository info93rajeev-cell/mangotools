import { Icon } from '../../primitives/Icon.tsx';
import mobileStyles from './foodPlannerMobile.module.css';
import { LOCATIONS, OCCASIONS, PLANNING_TYPES } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CostEstimationMobileViewProps {
  planner: UseFoodPlannerReturn;
  recipeCosts?: unknown;
  totalIngredientCost?: number;
  totalOtherCost?: number;
  totalMenuCost?: number;
  costPerServing?: string | number;
}

const DISH_COSTS: Record<string, number> = {
  'shahi-paneer': 612,
  'dal-tadka': 208,
  'jeera-rice': 168,
  mathri: 228,
  'besan-ladoo': 680,
  raita: 154,
};

export function CostEstimationMobileView({ planner }: CostEstimationMobileViewProps) {
  const { selectedRecipes, setup, setSetup } = planner;

  const displayDishes =
    selectedRecipes.length > 0
      ? selectedRecipes
      : [
          { id: 'shahi-paneer', name: 'Shahi Paneer', servings: 20 },
          { id: 'dal-tadka', name: 'Dal Tadka', servings: 20 },
          { id: 'jeera-rice', name: 'Jeera Rice', servings: 20 },
          { id: 'mathri', name: 'Mathri', servings: 20 },
          { id: 'besan-ladoo', name: 'Besan Ladoo', servings: 20 },
          { id: 'raita', name: 'Raita', servings: 20 },
        ];

  return (
    <div class={mobileStyles.mobileContainer}>
      <MobileCostHeader />
      <MobileCostSetupCard setup={setup} setSetup={setSetup} />
      <MobileSelectedDishesCard dishes={displayDishes} />
      <MobileCostSummaryGrid />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <MobileOtherCostsCard />
        <MobileCostInsightsCard />
      </div>
    </div>
  );
}

function MobileCostHeader() {
  return (
    <div class={mobileStyles.mobileSectionHeader}>
      <div class={mobileStyles.mobileSectionHeaderIcon}>
        <Icon name="coins" />
      </div>
      <div>
        <h3 class={mobileStyles.mobileSectionHeaderTitle}>Cost Estimation</h3>
        <p class={mobileStyles.mobileSectionHeaderSub}>
          Helps estimate ingredient cost, other costs, and total menu cost.
        </p>
      </div>
    </div>
  );
}

function MobileCostSetupCard({
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-cost-loc">
            <Icon name="map-pin" /> Location
          </label>
          <select
            id="mob-cost-loc"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-cost-occ">
            <Icon name="flame" /> Occasion
          </label>
          <select
            id="mob-cost-occ"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-cost-pt">
            <Icon name="layers" /> Planning Type
          </label>
          <select
            id="mob-cost-pt"
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
          <label class={mobileStyles.mobileFieldLabel} for="mob-cost-guests">
            <Icon name="users" /> People / Servings
          </label>
          <select
            id="mob-cost-guests"
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
        <Icon name="rotate-ccw" /> Update Plan
      </button>
    </div>
  );
}

function MobileSelectedDishesCard({ dishes }: { dishes: Array<{ id: string; name: string }> }) {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="utensils" />
          <h4 class={mobileStyles.mobileCardTitle}>Selected Dishes ({dishes.length})</h4>
        </div>
        <span
          style={{
            background: '#fef9c3',
            color: '#854d0e',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          Total Menu Cost: ₹2,050
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dishes.map((dish) => {
          const cost = DISH_COSTS[dish.id] ?? 200;
          return (
            <div
              key={dish.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={`/food/recipes/${dish.id.includes('paneer') ? 'shahi-paneer' : dish.id.includes('dal') ? 'dal-tadka' : 'besan-ladoo'}.jpg`}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/food/recipes/dal-tadka.jpg';
                  }}
                />
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>{dish.name}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: '11.5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  <Icon name="users" /> 20 servings
                </span>
                <span
                  style={{
                    background: '#fef9c3',
                    color: '#854d0e',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  ₹{cost}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileCostSummaryGrid() {
  return (
    <div class={mobileStyles.mobileCard}>
      <div class={mobileStyles.mobileCardHeader}>
        <div class={mobileStyles.mobileCardHeaderLeft}>
          <Icon name="bar-chart-2" />
          <h4 class={mobileStyles.mobileCardTitle}>Cost Summary</h4>
        </div>
      </div>
      <div class={mobileStyles.mobileSummary2x2}>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="shopping-bag" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Total Ingredient Cost</p>
            <p class={mobileStyles.mobileSummaryTileValue}>₹1,672</p>
          </div>
        </div>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="coins" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Other Cost</p>
            <p class={mobileStyles.mobileSummaryTileValue}>₹378</p>
          </div>
        </div>
        <div
          className={`${mobileStyles.mobileSummaryTile} ${mobileStyles.mobileSummaryTileYellow}`}
        >
          <Icon name="utensils" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Total Menu Cost</p>
            <p class={mobileStyles.mobileSummaryTileValue}>₹2,050</p>
          </div>
        </div>
        <div class={mobileStyles.mobileSummaryTile}>
          <Icon name="users" />
          <div>
            <p class={mobileStyles.mobileSummaryTileLabel}>Cost per Serving</p>
            <p class={mobileStyles.mobileSummaryTileValue}>₹102.50</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileOtherCostsCard() {
  return (
    <div class={mobileStyles.mobileCard} style={{ padding: '10px' }}>
      <h5
        style={{
          margin: '0 0 8px 0',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Icon name="clipboard" /> Other Costs
      </h5>
      <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🔥 Cooking Fuel</span>
          <strong>₹120</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>📦 Packaging / Serving</span>
          <strong>₹96</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>💧 Oil &amp; Ghee (Extra)</span>
          <strong>₹112</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>••• Misc. Expenses</span>
          <strong>₹50</strong>
        </div>
      </div>
    </div>
  );
}

function MobileCostInsightsCard() {
  return (
    <div class={mobileStyles.mobileCard} style={{ padding: '10px' }}>
      <h5
        style={{
          margin: '0 0 8px 0',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Icon name="bar-chart-2" /> Cost Insights
      </h5>
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Ingredient share</span>
          <strong>81.6%</strong>
        </div>
        <div class={mobileStyles.mobileProgressBar}>
          <div class={mobileStyles.mobileProgressFill} style={{ width: '81.6%' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 2px 0' }}>
          <span>Other cost share</span>
          <strong>18.4%</strong>
        </div>
        <div class={mobileStyles.mobileProgressBar}>
          <div
            class={mobileStyles.mobileProgressFill}
            style={{ width: '18.4%', background: '#93c5fd' }}
          />
        </div>

        <div
          style={{
            marginTop: '8px',
            padding: '4px',
            background: '#fef9c3',
            borderRadius: '4px',
            color: '#854d0e',
            textAlign: 'center',
          }}
        >
          🏆 Shahi Paneer (₹612)
        </div>
      </div>
    </div>
  );
}
