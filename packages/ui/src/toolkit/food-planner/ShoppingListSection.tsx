import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { ingredientTotal, money, sumMoney } from './plannerResults.ts';
import { GroceryDiscoveryCard } from './ShoppingListComponents.tsx';
import { ShoppingListMobileView } from './ShoppingListMobileView.tsx';
import { ShoppingMainPanel } from './ShoppingTableComponents.tsx';
import {
  buildShoppingItems,
  type ShoppingLineItem,
  useGroupedShoppingItems,
} from './shoppingListUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListSectionProps {
  planner: UseFoodPlannerReturn;
}

export function ShoppingListSection({ planner }: ShoppingListSectionProps) {
  const state = useShoppingListState(planner);

  return (
    <>
      <div class={styles.desktopOnly}>
        <ShoppingDesktopGrid planner={planner} state={state} />
      </div>

      <div class={styles.mobileOnly}>
        <ShoppingListMobileView
          planner={planner}
          boughtMap={planner.boughtItems}
          onToggleBought={planner.toggleBoughtItem}
        />
      </div>
    </>
  );
}

function useShoppingListState(planner: UseFoodPlannerReturn) {
  const [groupBy, setGroupBy] = useState<'category' | 'shop' | 'all'>('category');
  const [combineSimilar, setCombineSimilar] = useState<boolean>(true);
  const [groceryQuery, setGroceryQuery] = useState(planner.setup.location || 'Delhi');
  const { manualQuantities, handleAdjustQuantity } = useShoppingQuantities(planner);

  const grouped = useGroupedShoppingItems(
    planner.engineConsolidated,
    planner.selectedRecipes,
    planner.portionFactors,
    planner.setup.guests,
    planner.setup.servingsPerGuest,
    planner.boughtItems,
    planner.engineCost,
    planner.priceMode,
    planner.userPrices,
    planner.ingredientCategories,
  );

  const totalCost = useMemo(() => ingredientTotal(planner.engineCost), [planner.engineCost]);

  const pagination = useShoppingPagination(grouped.shoppingItems.length);
  const sortedItems = [...grouped.shoppingItems].sort((a, b) =>
    groupBy === 'shop'
      ? a.storeType.localeCompare(b.storeType)
      : groupBy === 'category'
        ? a.aisle.localeCompare(b.aisle)
        : a.name.localeCompare(b.name),
  );
  const pagedItems = sortedItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize,
  );

  return {
    groupBy,
    setGroupBy,
    combineSimilar,
    setCombineSimilar,
    groceryQuery,
    setGroceryQuery,
    manualQuantities,
    handleAdjustQuantity,
    ...grouped,
    totalCost,
    pagination,
    pagedItems,
  };
}

interface ShoppingDesktopGridProps {
  planner: UseFoodPlannerReturn;
  state: ReturnType<typeof useShoppingListState>;
}

function ShoppingDesktopGrid({ planner, state }: ShoppingDesktopGridProps) {
  const {
    selectedRecipes,
    consolidateError,
    isLoadingConsolidated,
    toggleBoughtItem,
    setActiveSection,
  } = planner;
  return (
    <div class={styles.layoutGrid}>
      <ShoppingMainPanel
        totalItems={state.totalItems}
        recipeCount={selectedRecipes.length}
        groupBy={state.groupBy}
        onSetGroupBy={state.setGroupBy}
        combineSimilar={state.combineSimilar}
        onToggleCombine={state.setCombineSimilar}
        error={consolidateError}
        isLoading={isLoadingConsolidated}
        pagedItems={state.pagedItems}
        shoppingItemsCount={state.shoppingItems.length}
        manualQuantities={state.manualQuantities}
        onAdjustQuantity={state.handleAdjustQuantity}
        onToggleBought={toggleBoughtItem}
        pagination={state.pagination}
        onBrowse={() => setActiveSection('recipes')}
      />

      <ShoppingSidebar
        totalItems={state.totalItems}
        toBuyCount={state.toBuyCount}
        inListCount={state.inListCount}
        groupedItems={state.groupedItems}
        totalCost={state.totalCost}
        groceryQuery={state.groceryQuery}
        onChangeLocation={state.setGroceryQuery}
        onEdit={() => setActiveSection('ingredients')}
        onContinue={() => setActiveSection('cost')}
      />
    </div>
  );
}

function useShoppingQuantities(planner: UseFoodPlannerReturn) {
  const manualQuantities: Record<string, number> = {};

  const handleAdjustQuantity = (id: string, current: number, delta: number) => {
    const item = buildShoppingItems(
      planner.engineConsolidated,
      planner.selectedRecipes,
      planner.portionFactors,
      planner.setup.guests,
      planner.setup.servingsPerGuest,
      planner.boughtItems,
    ).find((line) => line.id === id);
    const factor = item?.unit === 'kg' || item?.unit === 'L' ? 1000 : 1;
    planner.setIngredientQuantities((prev) => ({
      ...prev,
      [id]: String(
        Number(
          (
            Math.max(0, current + delta) * factor +
            Number(planner.stockQuantities[id] ?? '0')
          ).toFixed(6),
        ),
      ),
    }));
  };

  return { manualQuantities, handleAdjustQuantity };
}

function useShoppingPagination(itemsCount: number) {
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

function ShoppingSidebar({
  totalItems,
  toBuyCount,
  inListCount,
  groupedItems,
  totalCost,
  groceryQuery,
  onChangeLocation,
  onEdit,
  onContinue,
}: {
  totalItems: number;
  toBuyCount: number;
  inListCount: number;
  groupedItems: Record<string, ShoppingLineItem[]>;
  totalCost: number;
  groceryQuery: string;
  onChangeLocation: (loc: string) => void;
  onEdit: () => void;
  onContinue: () => void;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <Icon name="package" /> Purchase Summary
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '10px 8px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Total Items</span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#1e3a8a', marginTop: '2px' }}
          >
            {totalItems}
          </strong>
        </div>
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            padding: '10px 8px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>To Buy</span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#9a3412', marginTop: '2px' }}
          >
            {toBuyCount}
          </strong>
        </div>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '10px 8px',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>In List</span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#166534', marginTop: '2px' }}
          >
            {inListCount}
          </strong>
        </div>
      </div>

      <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <h3
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          Estimated Cost
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ShoppingCategoryCosts groupedItems={groupedItems} />
        </div>

        <div class={styles.estCostYellowBanner}>
          <span>Total Estimated Cost</span>
          <span style={{ fontSize: '17px', fontWeight: 800 }}>{money(totalCost)}</span>
        </div>
        <p class={styles.cardSubtitle}>{t.roundingNote}</p>
      </div>

      <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Quick Actions
        </h3>
        <div class={styles.shoppingQuickActions}>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center' }}
            onClick={onEdit}
          >
            <Icon name="plus" /> Add Item
          </button>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center' }}
            onClick={onEdit}
          >
            <Icon name="pencil" /> Edit Price
          </button>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center' }}
            onClick={() => window.print()}
          >
            <Icon name="printer" /> Print List
          </button>
        </div>
      </div>

      <GroceryDiscoveryCard location={groceryQuery} onChangeLocation={onChangeLocation} />

      <button type="button" class={styles.ctaBtn} onClick={onContinue}>
        Continue to Cost Estimation <Icon name="arrow-right" />
      </button>
    </div>
  );
}

function ShoppingCategoryCosts({
  groupedItems,
}: {
  groupedItems: Record<string, ShoppingLineItem[]>;
}) {
  return (
    <>
      {' '}
      {Object.entries(groupedItems).map(([aisle, items]) => {
        const aisleCost = sumMoney(items.map((i) => i.estCost));
        return (
          <div
            key={aisle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12.5px',
              padding: '3px 0',
            }}
          >
            <span style={{ color: '#475569' }}>
              {AISLE_DISPLAY_MAP[aisle] ?? aisle} ({items.length})
            </span>
            <strong>₹{aisleCost.toLocaleString('en-IN')}</strong>
          </div>
        );
      })}
    </>
  );
}
