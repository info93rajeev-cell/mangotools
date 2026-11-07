import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import {
  AisleAccordionCard,
  GroceryDiscoveryCard,
  PurchaseSummaryStats,
} from './ShoppingListComponents.tsx';
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

  const [expandedAisles, setExpandedAisles] = useState<Record<string, boolean>>({
    vegetables: true,
    pulses: true,
    grains: true,
    spices: true,
    dairy: true,
  });
  const [groceryQuery, setGroceryQuery] = useState(setup.location || 'Delhi');

  const toggleAisle = (aisle: string) => {
    setExpandedAisles((prev) => ({ ...prev, [aisle]: !prev[aisle] }));
  };

  const { groupedItems, totalItems, inListCount, toBuyCount } = useGroupedShoppingItems(
    engineConsolidated,
    selectedRecipes,
    portionFactors,
    setup.guests,
    setup.servingsPerGuest,
    boughtItems,
  );

  return (
    <div class={styles.layoutGrid}>
      <ShoppingListMainCard
        totalItems={totalItems}
        recipesCount={selectedRecipes.length}
        error={consolidateError}
        isLoading={isLoadingConsolidated}
        groupedItems={groupedItems}
        expandedAisles={expandedAisles}
        onToggleAisle={toggleAisle}
        onToggleBought={toggleBoughtItem}
        onBrowse={() => setActiveSection('recipes')}
      />

      <ShoppingSidebar
        totalItems={totalItems}
        toBuyCount={toBuyCount}
        inListCount={inListCount}
        groupedItems={groupedItems}
        groceryQuery={groceryQuery}
        onChangeLocation={setGroceryQuery}
        onContinue={() => setActiveSection('cost')}
      />
    </div>
  );
}

function ShoppingListMainCard({
  totalItems,
  recipesCount,
  error,
  isLoading,
  groupedItems,
  expandedAisles,
  onToggleAisle,
  onToggleBought,
  onBrowse,
}: {
  totalItems: number;
  recipesCount: number;
  error: string | null;
  isLoading: boolean;
  groupedItems: Record<string, ShoppingLineItem[]>;
  expandedAisles: Record<string, boolean>;
  onToggleAisle: (a: string) => void;
  onToggleBought: (id: string) => void;
  onBrowse: () => void;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <div class={styles.cardTitleGroup}>
          <h2 class={styles.cardTitle}>
            <Icon name="shopping-cart" /> Shopping List ({totalItems} items)
          </h2>
          <p class={styles.cardSubtitle}>
            Consolidated purchase list with rounded buy units for {recipesCount} recipes.
          </p>
        </div>
        <button type="button" class={styles.actionBtn} onClick={() => window.print()}>
          <Icon name="printer" /> Print List
        </button>
      </div>

      {recipesCount === 0 ? (
        <ShoppingEmptyState onBrowse={onBrowse} />
      ) : (
        <>
          <ShoppingListAlerts error={error} isLoading={isLoading} />
          {Object.keys(groupedItems).length === 0 ? (
            <p
              style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}
            >
              No shopping items required for the selected recipes.
            </p>
          ) : (
            Object.entries(groupedItems).map(([aisle, items]) => (
              <AisleAccordionCard
                key={aisle}
                aisle={aisle}
                items={items}
                isExpanded={expandedAisles[aisle] !== false}
                onToggle={() => onToggleAisle(aisle)}
                onToggleBought={onToggleBought}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

function ShoppingListAlerts({ error, isLoading }: { error: string | null; isLoading: boolean }) {
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
            marginBottom: '12px',
          }}
        >
          <strong>⚠️ Calculation Note:</strong> {error}. Displaying preliminary item estimates.
        </div>
      )}
      {isLoading && (
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
          Updating exact consolidation...
        </div>
      )}
    </>
  );
}

function ShoppingEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#475569' }}>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
        No dishes in your menu yet
      </p>
      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        Add recipes in Recipes &amp; Menu to generate your consolidated shopping list.
      </p>
      <button
        type="button"
        class={styles.actionBtn}
        style={{ marginTop: '14px' }}
        onClick={onBrowse}
      >
        <Icon name="utensils" /> Browse Recipes &amp; Menu
      </button>
    </div>
  );
}

function ShoppingSidebar({
  totalItems,
  toBuyCount,
  inListCount,
  groupedItems,
  groceryQuery,
  onChangeLocation,
  onContinue,
}: {
  totalItems: number;
  toBuyCount: number;
  inListCount: number;
  groupedItems: Record<string, ShoppingLineItem[]>;
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

      <PurchaseSummaryStats total={totalItems} toBuy={toBuyCount} inStock={inListCount} />

      <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <h3
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          Aisle Breakdown
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
                  padding: '4px 0',
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
      </div>

      <GroceryDiscoveryCard location={groceryQuery} onChangeLocation={onChangeLocation} />

      <button type="button" class={styles.ctaBtn} onClick={onContinue}>
        <Icon name="coins" /> Continue to Cost Estimation <Icon name="arrow-right" />
      </button>
    </div>
  );
}
