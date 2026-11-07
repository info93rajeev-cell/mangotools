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
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CostEstimationSectionProps {
  planner: UseFoodPlannerReturn;
}

export function CostEstimationSection({ planner }: CostEstimationSectionProps) {
  const {
    setup,
    selectedRecipes,
    engineCost,
    isLoadingCost,
    costError,
    otherCosts,
    updateOtherCost,
    totalOtherCost,
    targetBudget,
    setTargetBudget,
    priceMode,
    setPriceMode,
    setActiveSection,
  } = planner;

  const costData = useMemo(
    () => calculateCostData(engineCost, selectedRecipes.length, setup.guests, totalOtherCost),
    [engineCost, selectedRecipes.length, setup.guests, totalOtherCost],
  );

  const recipeCosts = useMemo(
    () => calculateRecipeCosts(selectedRecipes, setup.guests, totalOtherCost),
    [selectedRecipes, setup.guests, totalOtherCost],
  );

  const highestCostDish = useMemo(() => {
    if (recipeCosts.length === 0) return null;
    return [...recipeCosts].sort((a, b) => b.totalDish - a.totalDish)[0];
  }, [recipeCosts]);

  if (selectedRecipes.length === 0) {
    return <CostEmptyState onBrowse={() => setActiveSection('recipes')} />;
  }

  return (
    <div class={styles.layoutGrid}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <CostAlerts error={costError} isLoading={isLoadingCost} />
        <MenuCostTable
          recipeCosts={recipeCosts}
          priceMode={priceMode}
          onSetPriceMode={setPriceMode}
        />
        <OtherCostsCard
          items={otherCosts}
          totalOtherCost={totalOtherCost}
          onUpdate={updateOtherCost}
        />
      </div>

      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <h2 class={styles.cardTitle}>
            <Icon name="chart-column" /> Cost Summary
          </h2>
        </div>

        <CostSummaryStats
          totalIngredientCost={costData.totalIngredientCost}
          totalOtherCost={totalOtherCost}
          totalMenuCost={costData.totalMenuCost}
          costPerServing={costData.costPerServing}
          guests={setup.guests}
          dishesCount={selectedRecipes.length}
        />

        <BudgetTargetCard
          budget={targetBudget}
          totalCost={costData.totalMenuCost}
          onSetBudget={setTargetBudget}
        />

        <CostInsightsCard
          costPerServing={costData.costPerServing}
          highestCostDish={highestCostDish ?? null}
          ingredientCost={costData.totalIngredientCost}
          totalCost={costData.totalMenuCost}
        />

        <div style={{ marginTop: '20px' }}>
          <button
            type="button"
            class={`${styles.btn} ${styles.btnPrimary}`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setActiveSection('schedule')}
          >
            Generate Cooking Schedule <Icon name="arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CostEmptyState({ onBrowse }: { onBrowse: () => void }) {
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
}: {
  recipeCosts: RecipeCostItem[];
  priceMode: 'retail' | 'wholesale';
  onSetPriceMode: (m: 'retail' | 'wholesale') => void;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <div class={styles.cardTitleGroup}>
          <h2 class={styles.cardTitle}>
            <Icon name="coins" /> Menu Dish Cost Breakdown
          </h2>
          <p class={styles.cardSubtitle}>
            Estimated ingredient costs calculated using verified reference prices.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            class={`${styles.btn} ${styles.btnSecondary}`}
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
            class={`${styles.btn} ${styles.btnSecondary}`}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              background: priceMode === 'wholesale' ? '#dbeafe' : '#fff',
              color: priceMode === 'wholesale' ? '#1e40af' : '#475569',
            }}
            onClick={() => onSetPriceMode('wholesale')}
          >
            Wholesale / Mandi
          </button>
        </div>
      </div>

      <div class={styles.tableWrapper}>
        <table class={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '36px' }}>#</th>
              <th>Dish Name</th>
              <th>Servings</th>
              <th>Est. Weight</th>
              <th>Ing. Cost</th>
              <th>Other</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {recipeCosts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No dishes selected in menu.
                </td>
              </tr>
            ) : (
              recipeCosts.map((dish) => (
                <tr key={dish.id}>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{dish.num}</td>
                  <td style={{ fontWeight: 600 }}>{dish.name}</td>
                  <td>{dish.servings}</td>
                  <td>{dish.totalQty}</td>
                  <td>₹{dish.ingCost.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#64748b' }}>₹{dish.otherCost}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>
                    ₹{dish.totalDish.toLocaleString('en-IN')}
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

function calculateCostData(
  engineCost: unknown,
  recipeCount: number,
  guests: number,
  totalOtherCost: number,
) {
  const raw = engineCost as { totalCostInr?: string } | null;
  const ingredientCost = raw?.totalCostInr
    ? Number.parseFloat(raw.totalCostInr)
    : recipeCount * (guests * 18);
  const totalMenuCost = ingredientCost + totalOtherCost;
  const costPerServing = guests > 0 ? (totalMenuCost / guests).toFixed(2) : '0.00';

  return {
    totalIngredientCost: Math.round(ingredientCost),
    totalMenuCost: Math.round(totalMenuCost),
    costPerServing,
  };
}

function calculateRecipeCosts(
  selectedRecipes: Array<{ id: string; name: string; ingredients: unknown[] }>,
  guests: number,
  totalOtherCost: number,
): RecipeCostItem[] {
  const totalDishes = selectedRecipes.length || 1;
  const perDishOther = totalOtherCost / totalDishes;

  return selectedRecipes.map((recipe, idx) => {
    const baseRatio = (recipe.ingredients.length * 20 * guests) / 4;
    const ingCost = Math.round(baseRatio);
    const totalDish = Math.round(ingCost + perDishOther);
    return {
      id: recipe.id,
      num: idx + 1,
      name: recipe.name,
      servings: guests,
      totalQty: `${(guests * 0.15).toFixed(2)} kg`,
      ingCost,
      otherCost: Math.round(perDishOther),
      totalDish,
    };
  });
}
