import { useMemo, useState } from 'preact/hooks';
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

  const { selectAll, selectedDishes, toggleDish, toggleSelectAll } =
    useCostDishSelection(selectedRecipes);

  const costData = useMemo(
    () => calculateCostData(engineCost, setup.guests, totalOtherCost),
    [engineCost, setup.guests, totalOtherCost],
  );

  const recipeCosts = useMemo(
    () => calculateRecipeCosts(selectedRecipes, setup.guests, totalOtherCost),
    [selectedRecipes, setup.guests, totalOtherCost],
  );

  if (selectedRecipes.length === 0) {
    return <CostEmptyState onBrowse={() => setActiveSection('recipes')} />;
  }

  return (
    <div class={styles.layoutGrid}>
      <CostLeftPanel
        costError={costError}
        isLoadingCost={isLoadingCost}
        recipeCosts={recipeCosts}
        priceMode={priceMode}
        onSetPriceMode={setPriceMode}
        selectAll={selectAll}
        selectedDishes={selectedDishes}
        onToggleSelectAll={toggleSelectAll}
        onToggleDish={toggleDish}
        onManageMenu={() => setActiveSection('recipes')}
        otherCosts={otherCosts}
        totalOtherCost={totalOtherCost}
        onUpdateOtherCost={updateOtherCost}
      />

      <CostRightPanel
        costData={costData}
        totalOtherCost={totalOtherCost}
        guests={setup.guests}
        dishesCount={selectedRecipes.length}
        targetBudget={targetBudget}
        onSetTargetBudget={setTargetBudget}
        recipeCosts={recipeCosts}
        onContinue={() => setActiveSection('schedule')}
      />
    </div>
  );
}

function useCostDishSelection(selectedRecipes: { id: string }[]) {
  const [selectAll, setSelectAll] = useState(true);
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(
    () => new Set(selectedRecipes.map((r) => r.id)),
  );

  const toggleDish = (id: string) => {
    setSelectedDishes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedDishes(checked ? new Set(selectedRecipes.map((r) => r.id)) : new Set());
  };

  return { selectAll, selectedDishes, toggleDish, toggleSelectAll };
}
