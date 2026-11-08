import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { GroceryDiscoveryCard } from './ShoppingListComponents.tsx';
import { ShoppingMainPanel } from './ShoppingTableComponents.tsx';
import { type ShoppingLineItem, useGroupedShoppingItems } from './shoppingListUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface ShoppingListSectionProps {
  planner: UseFoodPlannerReturn;
}

export function ShoppingListSection({ planner }: ShoppingListSectionProps) {
  const {
    setup,
    selectedRecipes,
    portionFactors,
    engineConsolidated,
    isLoadingConsolidated,
    consolidateError,
    boughtItems,
    toggleBoughtItem,
    setActiveSection,
  } = planner;

  const [groupBy, setGroupBy] = useState<'category' | 'shop' | 'all'>('category');
  const [combineSimilar, setCombineSimilar] = useState<boolean>(true);
  const [groceryQuery, setGroceryQuery] = useState(setup.location || 'Delhi');
  const { manualQuantities, handleAdjustQuantity } = useShoppingQuantities();

  const { shoppingItems, groupedItems, totalItems, inListCount, toBuyCount } =
    useGroupedShoppingItems(
      engineConsolidated,
      selectedRecipes,
      portionFactors,
      setup.guests,
      setup.servingsPerGuest,
      boughtItems,
    );

  const totalCost = useMemo(
    () => shoppingItems.reduce((sum, item) => sum + item.estCost, 0),
    [shoppingItems],
  );

  const pagination = useShoppingPagination(shoppingItems.length);
  const pagedItems = shoppingItems.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize,
  );

  return (
    <div class={styles.layoutGrid}>
      <ShoppingMainPanel
        totalItems={totalItems}
        recipeCount={selectedRecipes.length}
        groupBy={groupBy}
        onSetGroupBy={setGroupBy}
        combineSimilar={combineSimilar}
        onToggleCombine={setCombineSimilar}
        error={consolidateError}
        isLoading={isLoadingConsolidated}
        pagedItems={pagedItems}
        shoppingItemsCount={shoppingItems.length}
        manualQuantities={manualQuantities}
        onAdjustQuantity={handleAdjustQuantity}
        onToggleBought={toggleBoughtItem}
        pagination={pagination}
        onBrowse={() => setActiveSection('recipes')}
      />

      <ShoppingSidebar
        totalItems={totalItems}
        toBuyCount={toBuyCount}
        inListCount={inListCount}
        groupedItems={groupedItems}
        totalCost={totalCost}
        groceryQuery={groceryQuery}
        onChangeLocation={setGroceryQuery}
        onContinue={() => setActiveSection('cost')}
      />
    </div>
  );
}

function useShoppingQuantities() {
  const [manualQuantities, setManualQuantities] = useState<Record<string, number>>({});

  const handleAdjustQuantity = (id: string, current: number, delta: number) => {
    setManualQuantities((prev) => {
      const existing = prev[id] ?? current;
      const nextVal = Math.max(0.1, Number((existing + delta).toFixed(2)));
      return { ...prev, [id]: nextVal };
    });
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
  onContinue,
}: {
  totalItems: number;
  toBuyCount: number;
  inListCount: number;
  groupedItems: Record<string, ShoppingLineItem[]>;
  totalCost: number;
  groceryQuery: string;
  onChangeLocation: (loc: string) => void;
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
          {Object.entries(groupedItems).map(([aisle, items]) => {
            const aisleCost = items.reduce((sum, i) => sum + i.estCost, 0);
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
        </div>

        <div class={styles.estCostYellowBanner}>
          <span>Total Estimated Cost</span>
          <span style={{ fontSize: '17px', fontWeight: 800 }}>
            ₹{totalCost.toLocaleString('en-IN')}.00
          </span>
        </div>
      </div>

      <div style={{ marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button type="button" class={styles.actionBtn} style={{ justifyContent: 'center' }}>
            <Icon name="plus" /> Add Item
          </button>
          <button type="button" class={styles.actionBtn} style={{ justifyContent: 'center' }}>
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
