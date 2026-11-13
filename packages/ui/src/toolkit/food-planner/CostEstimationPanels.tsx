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
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';
import { exportCostRows } from './plannerExport.ts';
import { allocateRecipeCosts, majorUnits, minorUnits } from './plannerResults.ts';
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
  currencySymbol?: string;
  currency?: string;
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
        currencySymbol={props.currencySymbol}
      />
      <OtherCostsCard
        items={props.otherCosts}
        totalOtherCost={props.totalOtherCost}
        onUpdate={props.onUpdateOtherCost}
        currencySymbol={props.currencySymbol}
        currency={props.currency}
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
  currencySymbol?: string;
  currency?: string;
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
        currencySymbol={props.currencySymbol}
        currency={props.currency}
      />

      <details>
        <summary>{t.targetBudget}</summary>
        <BudgetTargetCard
          budget={props.targetBudget}
          totalCost={props.costData.totalMenuCost}
          onSetBudget={props.onSetTargetBudget}
          currencySymbol={props.currencySymbol}
          currency={props.currency}
        />
      </details>

      <CostInsightsCard
        costPerServing={props.costData.costPerServing}
        highestCostDish={highestCostDish}
        ingredientCost={props.costData.totalIngredientCost}
        totalCost={props.costData.totalMenuCost}
        currencySymbol={props.currencySymbol}
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
          <strong>⚠️ Cost Calculation Note:</strong> {error}. Results are unavailable. Check your
          inputs.
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
  currencySymbol = '₹',
}: {
  recipeCosts: RecipeCostItem[];
  priceMode: 'retail' | 'wholesale';
  onSetPriceMode: (m: 'retail' | 'wholesale') => void;
  selectAll: boolean;
  selectedDishes: Set<string>;
  onToggleSelectAll: (c: boolean) => void;
  onToggleDish: (id: string) => void;
  onManageMenu: () => void;
  currencySymbol?: string;
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
              <th>Ingredient Cost ({currencySymbol})</th>
              <th>Other Cost ({currencySymbol})</th>
              <th style={{ textAlign: 'right' }}>Total Cost ({currencySymbol})</th>
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
                  <td>
                    {currencySymbol}
                    {dish.ingCost.toFixed(2)}
                  </td>
                  <td style={{ color: '#64748b' }}>
                    {currencySymbol}
                    {dish.otherCost.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                    {currencySymbol}
                    {dish.totalDish.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p class={styles.cardSubtitle}>{t.selectionHint}</p>
      <button
        type="button"
        class={styles.actionBtn}
        disabled={selectedDishes.size === 0}
        onClick={() => exportCostRows(recipeCosts.filter((dish) => selectedDishes.has(dish.id)))}
      >
        {t.exportSelected}
      </button>
    </div>
  );
}

export function calculateCostData(engineCost: unknown, guests: number, totalOtherCost: number) {
  const raw = engineCost as { totalCostInr?: string } | null;
  const ingredient = minorUnits(raw?.totalCostInr ?? '0');
  const total = ingredient + minorUnits(totalOtherCost);
  const count = BigInt(Math.max(1, guests));
  const perGuest = (total * 2n + count) / (2n * count);
  return {
    totalIngredientCost: majorUnits(ingredient),
    totalMenuCost: majorUnits(total),
    costPerServing: majorUnits(perGuest).toFixed(2),
  };
}

export function calculateRecipeCosts(
  recipes: ExtendedFoodRecipe[],
  guests: number,
  otherCost: number,
  engineCost?: unknown,
  factors: Record<string, number> = {},
): RecipeCostItem[] {
  return allocateRecipeCosts(recipes, guests, otherCost, engineCost, factors);
}
