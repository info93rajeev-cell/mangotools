import { useMemo, useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import {
  IngredientsMainPanel,
  type UseIngredientsFilterStateReturn,
} from './IngredientsMainPanel.tsx';
import { getCategoryGroup, IngredientsSidebar } from './IngredientsSidebarComponents.tsx';
import type { IngredientsPagination } from './IngredientsTableComponents.tsx';
import { extractIngredientLines, type IngredientLineItem } from './ingredientsUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface IngredientsSectionProps {
  planner: UseFoodPlannerReturn;
}

function matchesIngredient(
  l: IngredientLineItem,
  filterText: string,
  activeCategory: string,
): boolean {
  if (filterText && !l.name.toLowerCase().includes(filterText.toLowerCase())) {
    return false;
  }
  if (activeCategory === 'all') return true;
  return getCategoryGroup(l.aisle) === activeCategory;
}

export function IngredientsSection({ planner }: IngredientsSectionProps) {
  const {
    setup,
    selectedRecipes,
    engineConsolidated,
    isLoadingConsolidated,
    consolidateError,
    setActiveSection,
    clearAllRecipes,
  } = planner;

  const filterState = useIngredientsFilterState(
    engineConsolidated,
    selectedRecipes,
    setup.guests,
    setup.servingsPerGuest,
  );

  const pagination = useIngredientsPagination(filterState.filteredLines.length);
  const pagedLines = filterState.filteredLines.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize,
  );

  return (
    <div class={styles.layoutGrid}>
      <IngredientsMainPanel
        recipeCount={selectedRecipes.length}
        guests={setup.guests}
        filterState={filterState}
        error={consolidateError}
        isLoading={isLoadingConsolidated}
        pagedLines={pagedLines}
        pagination={pagination}
        onBrowse={() => setActiveSection('recipes')}
      />

      <IngredientsSidebar
        lines={filterState.lines}
        recipesCount={selectedRecipes.length}
        guests={setup.guests}
        onClearAll={clearAllRecipes}
        onContinue={() => setActiveSection('shopping')}
      />
    </div>
  );
}

function useIngredientsFilterState(
  engineConsolidated: unknown,
  selectedRecipes: Parameters<typeof extractIngredientLines>[1],
  guests: number,
  servingsPerGuest: number = 1,
): UseIngredientsFilterStateReturn {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterText, setFilterText] = useState<string>('');
  const [autoMerge, setAutoMerge] = useState<boolean>(true);
  const [manualQuantities, setManualQuantities] = useState<Record<string, number>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const lines = useMemo(() => {
    const rawLines = extractIngredientLines(
      engineConsolidated,
      selectedRecipes,
      guests,
      servingsPerGuest,
    );
    return rawLines.filter((l) => !deletedIds.has(l.id));
  }, [engineConsolidated, selectedRecipes, guests, servingsPerGuest, deletedIds]);

  const filteredLines = useMemo(
    () => lines.filter((l) => matchesIngredient(l, filterText, activeCategory)),
    [lines, filterText, activeCategory],
  );

  const handleAdjustQuantity = (id: string, currentVal: number, delta: number) => {
    setManualQuantities((prev) => {
      const existing = prev[id] ?? currentVal;
      const nextVal = Math.max(0.1, Number((existing + delta).toFixed(2)));
      return { ...prev, [id]: nextVal };
    });
  };

  const handleDeleteItem = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  return {
    activeCategory,
    setActiveCategory,
    filterText,
    setFilterText,
    autoMerge,
    setAutoMerge,
    manualQuantities,
    lines,
    filteredLines,
    handleAdjustQuantity,
    handleDeleteItem,
  };
}

function useIngredientsPagination(itemsCount: number): IngredientsPagination {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const totalPages = Math.max(1, Math.ceil(itemsCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(itemsCount, currentPage * pageSize);

  const handlePageSize = (sz: number) => {
    setPageSize(sz);
    setPage(1);
  };

  return {
    page: currentPage,
    setPage,
    pageSize,
    setPageSize: handlePageSize,
    totalPages,
    startIdx,
    endIdx,
  };
}
