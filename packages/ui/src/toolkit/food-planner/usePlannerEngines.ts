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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    run(
      'food.shopping.consolidate@1',
      {
        ingredients: CATALOG_INGREDIENTS,
        recipes: selectedRecipes,
        selection,
        guests: setup.guests,
        servingsPerGuest: String(setup.servingsPerGuest ?? '1'),
      },
      { diet: setup.diet, dietPolicy: setup.dietPolicy },
      controller.signal,
    )
      .then((res) => {
        if (!active) return;
        setIsLoading(false);
        if (res.ok) {
          setEngineConsolidated(res.value);
          setError(null);
        } else {
          setEngineConsolidated(null);
          const errRes = res as { error?: { message?: string; code?: string } };
          setError(errRes.error?.message || errRes.error?.code || 'Consolidation failed');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Calculation error');
      });
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

  return { engineConsolidated, isLoadingConsolidated: isLoading, consolidateError: error };
}

export function useCostEngine(
  engineConsolidated: unknown,
  guests: number,
  priceMode: 'retail' | 'wholesale',
  targetBudget: string,
  run: RunFn,
) {
  const [engineCost, setEngineCost] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const cons = engineConsolidated as {
      lines?: Array<{ ingredient: string; buy: string; unit: string; total?: string }>;
    } | null;
    if (!cons?.lines || cons.lines.length === 0) {
      setEngineCost(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    const cleanLines = cons.lines.map((l) => ({
      ingredient: l.ingredient,
      buy: String(l.buy),
      unit: l.unit as 'g' | 'ml' | 'piece',
      ...(l.total ? { total: String(l.total) } : {}),
    }));
    run(
      'food.cost.estimate@1',
      {
        guests,
        lines: cleanLines,
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
        if (!active) return;
        setIsLoading(false);
        if (res.ok) {
          setEngineCost(res.value);
          setError(null);
        } else {
          setEngineCost(null);
          const errRes = res as { error?: { message?: string; code?: string } };
          setError(errRes.error?.message || errRes.error?.code || 'Cost estimation failed');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Cost calculation error');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [engineConsolidated, guests, priceMode, targetBudget, run]);

  return { engineCost, isLoadingCost: isLoading, costError: error };
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    if (selectedRecipes.length === 0) {
      setEngineSchedule(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
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
        if (!active) return;
        setIsLoading(false);
        if (res.ok) {
          setEngineSchedule(res.value);
          setError(null);
        } else {
          setEngineSchedule(null);
          const errRes = res as { error?: { message?: string; code?: string } };
          setError(errRes.error?.message || errRes.error?.code || 'Schedule generation failed');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'Schedule calculation error');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedRecipes, guests, mealTime, burners, prepStations, run]);

  return { engineSchedule, isLoadingSchedule: isLoading, scheduleError: error };
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
  const shopping = useShoppingEngine(selectedRecipes, portionFactors, setup, run);
  const cost = useCostEngine(
    shopping.engineConsolidated,
    setup.guests,
    priceMode,
    targetBudget,
    run,
  );
  const schedule = useScheduleEngine(
    selectedRecipes,
    setup.guests,
    mealTime,
    burners,
    prepStations,
    run,
  );

  return {
    ...shopping,
    ...cost,
    ...schedule,
  };
}
