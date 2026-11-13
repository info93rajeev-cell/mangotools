import { useMemo, useState } from 'preact/hooks';
import { CostEstimationMobileView } from './CostEstimationMobileView.tsx';
import {
  CostEmptyState,
  CostLeftPanel,
  CostRightPanel,
  calculateCostData,
  calculateRecipeCosts,
} from './CostEstimationPanels.tsx';
import styles from './foodPlanner.module.css';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface CostEstimationSectionProps {
  planner: UseFoodPlannerReturn;
}

export function CostEstimationSection({ planner }: CostEstimationSectionProps) {
  const { setup, selectedRecipes, engineCost, totalOtherCost, setActiveSection } = planner;

  const dishSelection = useCostDishSelection(selectedRecipes);

  const costData = useMemo(
    () => calculateCostData(engineCost, setup.guests, totalOtherCost),
    [engineCost, setup.guests, totalOtherCost],
  );

  const recipeCosts = useMemo(
    () =>
      calculateRecipeCosts(
        selectedRecipes,
        setup.guests,
        totalOtherCost,
        engineCost,
        planner.portionFactors,
      ),
    [selectedRecipes, setup.guests, totalOtherCost, engineCost, planner.portionFactors],
  );

  if (selectedRecipes.length === 0) {
    return <CostEmptyState onBrowse={() => setActiveSection('recipes')} />;
  }

  return (
    <>
      <CostDesktopLayout
        planner={planner}
        recipeCosts={recipeCosts}
        costData={costData}
        dishSelection={dishSelection}
      />

      <div class={styles.mobileOnly}>
        <CostEstimationMobileView
          planner={planner}
          recipeCosts={recipeCosts}
          totalIngredientCost={costData.totalIngredientCost}
          totalOtherCost={totalOtherCost}
          totalMenuCost={costData.totalMenuCost}
          costPerServing={costData.costPerServing}
        />
      </div>
    </>
  );
}

interface CostDesktopLayoutProps {
  planner: UseFoodPlannerReturn;
  recipeCosts: ReturnType<typeof calculateRecipeCosts>;
  costData: ReturnType<typeof calculateCostData>;
  dishSelection: ReturnType<typeof useCostDishSelection>;
}

function CostDesktopLayout({
  planner,
  recipeCosts,
  costData,
  dishSelection,
}: CostDesktopLayoutProps) {
  const { selectAll, selectedDishes, toggleDish, toggleSelectAll } = dishSelection;

  return (
    <div class={styles.desktopOnly}>
      <div class={styles.layoutGrid}>
        <CostLeftPanel
          costError={planner.costError}
          isLoadingCost={planner.isLoadingCost}
          recipeCosts={recipeCosts}
          priceMode={planner.priceMode}
          onSetPriceMode={planner.setPriceMode}
          selectAll={selectAll}
          selectedDishes={selectedDishes}
          onToggleSelectAll={toggleSelectAll}
          onToggleDish={toggleDish}
          onManageMenu={() => planner.setActiveSection('recipes')}
          otherCosts={planner.otherCosts}
          totalOtherCost={planner.totalOtherCost}
          onUpdateOtherCost={planner.updateOtherCost}
          currencySymbol={planner.currencySymbol}
          currency={planner.currency}
        />

        <CostRightPanel
          costData={costData}
          totalOtherCost={planner.totalOtherCost}
          guests={planner.setup.guests}
          dishesCount={planner.selectedRecipes.length}
          targetBudget={planner.targetBudget}
          onSetTargetBudget={planner.setTargetBudget}
          recipeCosts={recipeCosts}
          onContinue={() => planner.setActiveSection('schedule')}
          currencySymbol={planner.currencySymbol}
          currency={planner.currency}
        />
      </div>
    </div>
  );
}

function useCostDishSelection(selectedRecipes: { id: string }[]) {
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const selectedDishes = new Set(
    selectedRecipes.filter((recipe) => !excluded.has(recipe.id)).map((recipe) => recipe.id),
  );
  const toggleDish = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = (checked: boolean) =>
    setExcluded(checked ? new Set() : new Set(selectedRecipes.map((recipe) => recipe.id)));
  return {
    selectAll: selectedDishes.size === selectedRecipes.length,
    selectedDishes,
    toggleDish,
    toggleSelectAll,
  };
}
