import { getWorkerHost, type RunFn } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';
import {
  CATALOG_INGREDIENTS,
  type ExtendedFoodRecipe,
  REFERENCE_PRICES,
} from './foodReferenceData.ts';
import type { PlanSetupState } from './useFoodPlanner.ts';

export const workerRun: RunFn = (...args) => getWorkerHost().run(...args);

export function useShoppingEngine(
  selectedRecipes: ExtendedFoodRecipe[],
  portionFactors: Record<string, number>,
  setup: PlanSetupState,
  run: RunFn,
) {
  const [engineConsolidated, setEngineConsolidated] = useState<unknown | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const selection = selectedRecipes.map((r) => ({
      recipe: r.id,
      recipeVersion: r.version,
      portionFactor: String(portionFactors[r.id] ?? 1),
    }));
    if (selection.length === 0) {
      setEngineConsolidated(null);
      return;
    }
    run(
      'food.shopping.consolidate@1',
      {
        ingredients: CATALOG_INGREDIENTS,
        recipes: selectedRecipes,
        selection,
        guests: setup.guests,
        servingsPerGuest: setup.servingsPerGuest,
      },
      { diet: setup.diet, dietPolicy: setup.dietPolicy },
      controller.signal,
    )
      .then((res) => {
        if (active && res.ok) setEngineConsolidated(res.value);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    selectedRecipes,
    portionFactors,
    setup.guests,
    setup.servingsPerGuest,
    setup.diet,
    setup.dietPolicy,
    run,
  ]);

  return engineConsolidated;
}

export function useCostEngine(
  engineConsolidated: unknown,
  guests: number,
  priceMode: 'retail' | 'wholesale',
  targetBudget: string,
  run: RunFn,
) {
  const [engineCost, setEngineCost] = useState<unknown | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const cons = engineConsolidated as {
      lines?: Array<{ ingredient: string; buy: string; unit: string }>;
    } | null;
    if (!cons?.lines || cons.lines.length === 0) {
      setEngineCost(null);
      return;
    }
    run(
      'food.cost.estimate@1',
      {
        guests,
        lines: cons.lines,
        prices: REFERENCE_PRICES,
        budgetInr: targetBudget || undefined,
      },
      {
        pricePriority: priceMode === 'wholesale' ? 'user-then-wholesale' : 'user-then-retail',
        quantityBasis: 'buy',
      },
      controller.signal,
    )
      .then((res) => {
        if (active && res.ok) setEngineCost(res.value);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [engineConsolidated, guests, priceMode, targetBudget, run]);

  return engineCost;
}

export function useScheduleEngine(
  selectedRecipes: ExtendedFoodRecipe[],
  guests: number,
  mealTime: string,
  burners: number,
  prepStations: number,
  run: RunFn,
) {
  const [engineSchedule, setEngineSchedule] = useState<unknown | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    if (selectedRecipes.length === 0) {
      setEngineSchedule(null);
      return;
    }
    const selection = selectedRecipes.map((r) => ({ recipe: r.id, recipeVersion: r.version }));
    run(
      'food.schedule.generate@1',
      {
        recipes: selectedRecipes,
        selection,
        guests,
        mealTime,
        burnersAvailable: burners,
        prepStations,
      },
      { restMinutes: 10, prepScaleFactor: 'logarithmic' },
      controller.signal,
    )
      .then((res) => {
        if (active && res.ok) setEngineSchedule(res.value);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedRecipes, guests, mealTime, burners, prepStations, run]);

  return engineSchedule;
}

export function usePlannerEngines(
  selectedRecipes: ExtendedFoodRecipe[],
  portionFactors: Record<string, number>,
  setup: PlanSetupState,
  targetBudget: string,
  priceMode: 'retail' | 'wholesale',
  mealTime: string,
  burners: number,
  prepStations: number,
  run: RunFn,
) {
  const engineConsolidated = useShoppingEngine(selectedRecipes, portionFactors, setup, run);
  const engineCost = useCostEngine(engineConsolidated, setup.guests, priceMode, targetBudget, run);
  const engineSchedule = useScheduleEngine(
    selectedRecipes,
    setup.guests,
    mealTime,
    burners,
    prepStations,
    run,
  );

  return { engineConsolidated, engineCost, engineSchedule };
}
