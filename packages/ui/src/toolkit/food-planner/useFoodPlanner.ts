import type { RunFn } from '@mangotools/runtime';
import { useCallback, useMemo, useState } from 'preact/hooks';
import type { ScheduleTaskItem } from './CookingScheduleTimeline.tsx';
import { RECIPES, SAMPLE_PLAN } from './foodReferenceData.ts';
import { sumMoney } from './plannerResults.ts';
import { usePlannerEngines, workerRun } from './usePlannerEngines.ts';

export type PlannerSection = 'recipes' | 'ingredients' | 'shopping' | 'cost' | 'schedule';

export interface PlanSetupState {
  location: string;
  occasion: string;
  planningType: string;
  guests: number;
  servingsPerGuest: number;
  diet: 'none' | 'vegetarian' | 'vegan' | 'jain';
  dietPolicy: 'flag' | 'exclude-recipes';
}

export interface OtherCostItem {
  id: string;
  label: string;
  defaultCost: number;
  cost: number;
  enabled: boolean;
}

const DEFAULT_SETUP: PlanSetupState = {
  location: SAMPLE_PLAN.location,
  occasion: SAMPLE_PLAN.occasion,
  planningType: SAMPLE_PLAN.planningType,
  guests: SAMPLE_PLAN.guests,
  servingsPerGuest: 1,
  diet: 'none',
  dietPolicy: 'flag',
};

const DEFAULT_OTHER_COSTS: OtherCostItem[] = [
  {
    id: 'cooking-fuel',
    label: 'Cooking Fuel (Gas/Induction)',
    defaultCost: 100,
    cost: 100,
    enabled: true,
  },
  { id: 'packaging', label: 'Packaging / Serving', defaultCost: 80, cost: 80, enabled: true },
  { id: 'extra-oil-ghee', label: 'Oil & Ghee (Extra)', defaultCost: 120, cost: 120, enabled: true },
  {
    id: 'misc-spices',
    label: 'Misc. (Spices, Ice, etc.)',
    defaultCost: 78,
    cost: 78,
    enabled: true,
  },
  { id: 'labour', label: 'Labour / Service Help', defaultCost: 0, cost: 0, enabled: false },
];

function usePlannerSelection() {
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(
    () => new Set(SAMPLE_PLAN.selectedDishes),
  );
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(['besan-ladoo', 'shahi-paneer']),
  );
  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [portionFactors, setPortionFactors] = useState<Record<string, number>>({});

  const selectedRecipes = useMemo(
    () => RECIPES.filter((r) => selectedRecipeIds.has(r.id)),
    [selectedRecipeIds],
  );

  const toggleRecipe = useCallback((id: string) => {
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setPortionFactor = useCallback((id: string, factor: number) => {
    setPortionFactors((prev) => ({ ...prev, [id]: Math.max(0.25, Math.min(10, factor)) }));
  }, []);

  const clearAllRecipes = useCallback(() => setSelectedRecipeIds(new Set()), []);

  return {
    favorites,
    toggleFavorite,
    selectedRecipeIds,
    setSelectedRecipeIds,
    portionFactors,
    setPortionFactors,
    selectedRecipes,
    toggleRecipe,
    setPortionFactor,
    clearAllRecipes,
  };
}

function usePlannerCosts() {
  const [userPrices, setUserPrices] = useState<Record<string, string>>({});
  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale'>('retail');
  const [targetBudget, setTargetBudget] = useState<string>('2500');
  const [otherCosts, setOtherCosts] = useState<OtherCostItem[]>(DEFAULT_OTHER_COSTS);

  const totalOtherCost = useMemo(() => {
    return sumMoney(otherCosts.filter((i) => i.enabled).map((i) => i.cost || 0));
  }, [otherCosts]);

  const updateOtherCost = useCallback((id: string, cost: number, enabled: boolean) => {
    if (!Number.isFinite(cost) || cost < 0 || cost > 1_000_000_000) return;
    setOtherCosts((prev) => prev.map((i) => (i.id === id ? { ...i, cost, enabled } : i)));
  }, []);

  return {
    userPrices,
    setUserPrices,
    priceMode,
    setPriceMode,
    targetBudget,
    setTargetBudget,
    otherCosts,
    setOtherCosts,
    updateOtherCost,
    totalOtherCost,
  };
}

function usePlannerChecklist() {
  const [mealTime, setMealTime] = useState<string>('17:00');
  const [burners, setBurners] = useState<number>(2);
  const [boughtItems, setBoughtItems] = useState<Record<string, boolean>>({});
  const [customTasks, setCustomTasks] = useState<ScheduleTaskItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleBoughtItem = useCallback((id: string) => {
    setBoughtItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleTaskCompleted = useCallback((id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    mealTime,
    setMealTime,
    burners,
    setBurners,
    boughtItems,
    setBoughtItems,
    toggleBoughtItem,
    customTasks,
    setCustomTasks,
    completedTasks,
    setCompletedTasks,
    toggleTaskCompleted,
  };
}

export function useFoodPlanner(run: RunFn = workerRun) {
  const [activeSection, setActiveSection] = useState<PlannerSection>('recipes');
  const [setup, setSetup] = useState<PlanSetupState>(DEFAULT_SETUP);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourse, setActiveCourse] = useState<string>('all');
  const [combineSimilar, setCombineSimilar] = useState<boolean>(true);
  const [stockQuantities, setStockQuantities] = useState<Record<string, string>>({});
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, string>>({});

  const selection = usePlannerSelection();
  const costs = usePlannerCosts();
  const checklist = usePlannerChecklist();

  const engines = usePlannerEngines(
    selection.selectedRecipes,
    selection.portionFactors,
    setup,
    costs.targetBudget,
    costs.priceMode,
    checklist.mealTime,
    checklist.burners,
    1,
    run,
    costs.userPrices,
    ingredientQuantities,
    stockQuantities,
  );

  const loadSamplePlan = useCallback(() => {
    setSetup(DEFAULT_SETUP);
    setStockQuantities({});
    setIngredientQuantities({});
    costs.setUserPrices({});
    costs.setOtherCosts(DEFAULT_OTHER_COSTS);
    selection.setSelectedRecipeIds(new Set(SAMPLE_PLAN.selectedDishes));
    selection.setPortionFactors({});
    checklist.setBoughtItems({});
    checklist.setCompletedTasks({});
    checklist.setCustomTasks([]);
    costs.setPriceMode('retail');
  }, [selection, checklist, costs]);

  return {
    stockQuantities,
    setStockQuantities,
    ingredientQuantities,
    setIngredientQuantities,
    activeSection,
    setActiveSection,
    setup,
    setSetup,
    searchQuery,
    setSearchQuery,
    activeCourse,
    setActiveCourse,
    combineSimilar,
    setCombineSimilar,
    loadSamplePlan,
    ...selection,
    ...costs,
    ...checklist,
    ...engines,
  };
}

export type UseFoodPlannerReturn = ReturnType<typeof useFoodPlanner>;
