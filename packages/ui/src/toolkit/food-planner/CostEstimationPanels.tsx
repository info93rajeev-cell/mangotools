import { useMemo } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import {
  BudgetTargetCard,
  CostInsightsCard,
  CostSummaryStats,
  OtherCostsCard,
  type RecipeCostItem,
} from './CostOtherExpensesCard.tsx';
import styles from './foodPlanner.module.css';
import type { OtherCostItem } from './useFoodPlanner.ts';

export function CostLeftPanel(props: {
  costError: string | null;
  isLoadingCost: boolean;
  recipeCosts: RecipeCostItem[];
  priceMode: 'retail' | 'wholesale';
  onSetPriceMode: (m: 'retail' | 'wholesale') => void;
  selectAll: boolean;
  selectedDishes: Set<string>;
  onToggleSelectAll: (c: boolean) => void;
  onToggleDish: (id: string) => void;
  onManageMenu: () => void;
  otherCosts: OtherCostItem[];
  totalOtherCost: number;
  onUpdateOtherCost: (id: string, cost: number, enabled: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <CostAlerts error={props.costError} isLoading={props.isLoadingCost} />
      <MenuCostTable
        recipeCosts={props.recipeCosts}
        priceMode={props.priceMode}
        onSetPriceMode={props.onSetPriceMode}
        selectAll={props.selectAll}
        selectedDishes={props.selectedDishes}
        onToggleSelectAll={props.onToggleSelectAll}
        onToggleDish={props.onToggleDish}
        onManageMenu={props.onManageMenu}
      />
      <OtherCostsCard
        items={props.otherCosts}
        totalOtherCost={props.totalOtherCost}
        onUpdate={props.onUpdateOtherCost}
      />
    </div>
  );
}

export function CostRightPanel(props: {
  costData: { totalIngredientCost: number; totalMenuCost: number; costPerServing: string };
  totalOtherCost: number;
  guests: number;
  dishesCount: number;
  targetBudget: string;
  onSetTargetBudget: (val: string) => void;
  recipeCosts: RecipeCostItem[];
  onContinue: () => void;
}) {
  const highestCostDish = useMemo(() => {
    if (props.recipeCosts.length === 0) return null;
    return [...props.recipeCosts].sort((a, b) => b.totalDish - a.totalDish)[0] ?? null;
  }, [props.recipeCosts]);

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <Icon name="chart-column" /> Cost Summary
        </h2>
      </div>

      <CostSummaryStats
        totalIngredientCost={props.costData.totalIngredientCost}
        totalOtherCost={props.totalOtherCost}
        totalMenuCost={props.costData.totalMenuCost}
        costPerServing={props.costData.costPerServing}
        guests={props.guests}
        dishesCount={props.dishesCount}
      />

      <BudgetTargetCard
        budget={props.targetBudget}
        totalCost={props.costData.totalMenuCost}
        onSetBudget={props.onSetTargetBudget}
      />

      <CostInsightsCard
        costPerServing={props.costData.costPerServing}
        highestCostDish={highestCostDish}
        ingredientCost={props.costData.totalIngredientCost}
        totalCost={props.costData.totalMenuCost}
      />

      <div style={{ marginTop: '20px' }}>
        <button
          type="button"
          class={styles.ctaBtn}
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={props.onContinue}
        >
          Generate Cooking Schedule <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}

export function CostEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div
      class={styles.card}
      style={{ textAlign: 'center', padding: '48px 16px', color: '#475569' }}
    >
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
        No dishes selected in your catering menu
      </p>
      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        Pick dishes in Recipes &amp; Menu to calculate ingredient costs and event budget breakdown.
      </p>
      <button
        type="button"
        class={styles.actionBtn}
        style={{ marginTop: '16px' }}
        onClick={onBrowse}
      >
        <Icon name="utensils" /> Browse Recipes &amp; Menu
      </button>
    </div>
  );
}

function CostAlerts({ error, isLoading }: { error: string | null; isLoading: boolean }) {
  return (
    <>
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '13px',
          }}
        >
          <strong>⚠️ Cost Calculation Note:</strong> {error}. Displaying reference estimates.
        </div>
      )}
      {isLoading && (
        <div style={{ fontSize: '12px', color: '#64748b', padding: '4px 0' }}>
          Updating cost calculations...
        </div>
      )}
    </>
  );
}

function MenuCostTable({
  recipeCosts,
  priceMode,
  onSetPriceMode,
  selectAll,
  selectedDishes,
  onToggleSelectAll,
  onToggleDish,
  onManageMenu,
}: {
  recipeCosts: RecipeCostItem[];
  priceMode: 'retail' | 'wholesale';
  onSetPriceMode: (m: 'retail' | 'wholesale') => void;
  selectAll: boolean;
  selectedDishes: Set<string>;
  onToggleSelectAll: (c: boolean) => void;
  onToggleDish: (id: string) => void;
  onManageMenu: () => void;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <div class={styles.cardTitleGroup}>
          <h2 class={styles.cardTitle}>
            <Icon name="coins" /> Menu for Cost Estimation
          </h2>
          <p class={styles.cardSubtitle}>
            Dish-by-dish ingredient costing with optional overhead allocation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => onToggleSelectAll((e.target as HTMLInputElement).checked)}
            />
            <span>Select All</span>
          </label>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={onManageMenu}
          >
            <Icon name="sliders-horizontal" /> Manage Menu
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              class={styles.actionBtn}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: priceMode === 'retail' ? '#dbeafe' : '#fff',
                color: priceMode === 'retail' ? '#1e40af' : '#475569',
              }}
              onClick={() => onSetPriceMode('retail')}
            >
              Retail Prices
            </button>
            <button
              type="button"
              class={styles.actionBtn}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: priceMode === 'wholesale' ? '#dbeafe' : '#fff',
                color: priceMode === 'wholesale' ? '#1e40af' : '#475569',
              }}
              onClick={() => onSetPriceMode('wholesale')}
            >
              Wholesale
            </button>
          </div>
        </div>
      </div>

      <div class={styles.tableWrapper}>
        <table class={styles.table} aria-label="Menu for Cost Estimation Table">
          <thead>
            <tr>
              <th style={{ width: '28px' }}></th>
              <th style={{ width: '28px' }}>#</th>
              <th>Recipe / Dish</th>
              <th>Servings</th>
              <th>Total Qty</th>
              <th>Ingredient Cost (₹)</th>
              <th>Other Cost (₹)</th>
              <th style={{ textAlign: 'right' }}>Total Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {recipeCosts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No dishes selected in menu.
                </td>
              </tr>
            ) : (
              recipeCosts.map((dish) => (
                <tr key={dish.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDishes.has(dish.id)}
                      onChange={() => onToggleDish(dish.id)}
                      aria-label={`Select ${dish.name} for cost calculation`}
                    />
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{dish.num}</td>
                  <td>
                    <div class={styles.tableItemWithThumb}>
                      <img
                        src={`/food/recipes/${dish.id}.jpg`}
                        alt=""
                        class={styles.tableThumb}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
                        }}
                      />
                      <strong>{dish.name}</strong>
                    </div>
                  </td>
                  <td>{dish.servings}</td>
                  <td>{dish.totalQty}</td>
                  <td>₹{dish.ingCost.toLocaleString('en-IN')}.00</td>
                  <td style={{ color: '#64748b' }}>₹{dish.otherCost}.00</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                    ₹{dish.totalDish.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function calculateCostData(engineCost: unknown, guests: number, totalOtherCost: number) {
  const raw = engineCost as { totalCostInr?: string } | null;
  const ingredientCost = raw?.totalCostInr ? Number.parseFloat(raw.totalCostInr) : 1672;
  const totalMenuCost = ingredientCost + totalOtherCost;
  const costPerServing = guests > 0 ? (totalMenuCost / guests).toFixed(2) : '102.50';

  return {
    totalIngredientCost: Math.round(ingredientCost),
    totalMenuCost: Math.round(totalMenuCost),
    costPerServing,
  };
}

export function calculateRecipeCosts(
  selectedRecipes: Array<{ id: string; name: string; ingredients: unknown[] }>,
  guests: number,
  totalOtherCost: number,
): RecipeCostItem[] {
  const totalDishes = selectedRecipes.length || 1;
  const perDishOther = totalOtherCost / totalDishes;

  const baseWeights: Record<string, number> = {
    'besan-ladoo': 280,
    mathri: 210,
    'shahi-paneer': 520,
    'dal-tadka': 240,
    'jeera-rice': 190,
    'aloo-gobi': 232,
    raita: 120,
    'mixed-veg-salad': 80,
  };

  return selectedRecipes.map((recipe, idx) => {
    const rawIng = baseWeights[recipe.id] ?? 200;
    const ingCost = Math.round(rawIng * (guests / 20));
    const totalDish = Math.round(ingCost + perDishOther);
    return {
      id: recipe.id,
      num: idx + 1,
      name: recipe.name,
      servings: guests,
      totalQty: `${(guests * 0.12 + 0.6).toFixed(2)} kg`,
      ingCost,
      otherCost: Math.round(perDishOther),
      totalDish,
    };
  });
}
