import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { getAisleColor } from './ingredientsUtils.ts';
import type { ShoppingLineItem } from './shoppingListUtils.ts';

export interface ShoppingPagination {
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalPages: number;
  startIdx: number;
  endIdx: number;
}

export function ShoppingMainPanel({
  totalItems,
  recipeCount,
  groupBy,
  onSetGroupBy,
  combineSimilar,
  onToggleCombine,
  error,
  isLoading,
  pagedItems,
  shoppingItemsCount,
  manualQuantities,
  onAdjustQuantity,
  onToggleBought,
  pagination,
  onBrowse,
}: {
  totalItems: number;
  recipeCount: number;
  groupBy: 'category' | 'shop' | 'all';
  onSetGroupBy: (g: 'category' | 'shop' | 'all') => void;
  combineSimilar: boolean;
  onToggleCombine: (c: boolean) => void;
  error: string | null;
  isLoading: boolean;
  pagedItems: ShoppingLineItem[];
  shoppingItemsCount: number;
  manualQuantities: Record<string, number>;
  onAdjustQuantity: (id: string, current: number, delta: number) => void;
  onToggleBought: (id: string) => void;
  pagination: ShoppingPagination;
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
            Consolidated purchase list with rounded buy units for {recipeCount} recipes.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            class={styles.pageSizeSelect}
            value={groupBy}
            onChange={(e) =>
              onSetGroupBy((e.target as HTMLSelectElement).value as 'category' | 'shop' | 'all')
            }
            aria-label="Group shopping list"
          >
            <option value="category">Group by Category ∨</option>
            <option value="shop">Sort by Shop ∨</option>
            <option value="all">Show All Items</option>
          </select>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#475569',
              cursor: 'pointer',
            }}
            title="Combine similar ingredients into single purchases"
          >
            <input
              type="checkbox"
              checked={combineSimilar}
              onChange={(e) => onToggleCombine((e.target as HTMLInputElement).checked)}
            />
            <span>Combine Similar</span>
          </label>
          <button type="button" class={styles.actionBtn} onClick={() => window.print()}>
            <Icon name="printer" /> Print
          </button>
        </div>
      </div>

      {recipeCount === 0 ? (
        <ShoppingEmptyState onBrowse={onBrowse} />
      ) : (
        <>
          <ShoppingListAlerts error={error} isLoading={isLoading} />

          <div class={styles.tableWrapper}>
            <table class={styles.table} aria-label="Consolidated Shopping List Table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }} aria-label="Status checkbox"></th>
                  <th>Ingredient</th>
                  <th>Category</th>
                  <th>Total Quantity</th>
                  <th>Unit</th>
                  <th>Est. Price (₹)</th>
                  <th>Est. Cost (₹)</th>
                  <th>Buy From</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => {
                  const rawVal = Number.parseFloat(item.buyQuantity) || 1;
                  const displayVal = manualQuantities[item.id] ?? rawVal;
                  const stepDelta = item.unit === 'piece' ? 1 : 0.25;

                  return (
                    <ShoppingTableRow
                      key={item.id}
                      item={item}
                      displayVal={displayVal}
                      rawVal={rawVal}
                      stepDelta={stepDelta}
                      onAdjustQuantity={onAdjustQuantity}
                      onToggleBought={onToggleBought}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          <ShoppingPaginationBar
            totalCount={shoppingItemsCount}
            startIdx={pagination.startIdx}
            endIdx={pagination.endIdx}
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}
    </div>
  );
}

function ShoppingTableRow({
  item,
  displayVal,
  rawVal,
  stepDelta,
  onAdjustQuantity,
  onToggleBought,
}: {
  item: ShoppingLineItem;
  displayVal: number;
  rawVal: number;
  stepDelta: number;
  onAdjustQuantity: (id: string, current: number, delta: number) => void;
  onToggleBought: (id: string) => void;
}) {
  const aisleColor = getAisleColor(item.aisle);
  const aisleLabel = AISLE_DISPLAY_MAP[item.aisle] ?? item.aisle;

  return (
    <tr style={{ background: item.isBought ? '#f8fafc' : 'transparent' }}>
      <td>
        <input
          type="checkbox"
          aria-label={`Mark ${item.name} as in stock`}
          checked={item.isBought}
          onChange={() => onToggleBought(item.id)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
      </td>
      <td>
        <div class={styles.tableItemWithThumb}>
          <img
            src={item.thumbnailUrl || '/food/recipes/jeera-rice.jpg'}
            alt=""
            class={styles.tableThumb}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/food/recipes/jeera-rice.jpg';
            }}
          />
          <strong>{item.name}</strong>
        </div>
      </td>
      <td>
        <span
          class={styles.badge}
          style={{
            background: `${aisleColor}18`,
            color: aisleColor,
            fontWeight: 600,
          }}
        >
          {aisleLabel}
        </span>
      </td>
      <td>
        <div class={styles.stepper}>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Decrease buy quantity for ${item.name}`}
            onClick={() => onAdjustQuantity(item.id, rawVal, -stepDelta)}
          >
            -
          </button>
          <span class={styles.stepperVal}>{displayVal.toFixed(displayVal % 1 === 0 ? 0 : 2)}</span>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Increase buy quantity for ${item.name}`}
            onClick={() => onAdjustQuantity(item.id, rawVal, stepDelta)}
          >
            +
          </button>
        </div>
      </td>
      <td>
        <select
          class={styles.pageSizeSelect}
          style={{ height: '26px', fontSize: '11px', padding: '0 4px' }}
          aria-label={`Unit for ${item.name}`}
        >
          <option value={item.unit}>{item.unit}</option>
          {item.unit === 'g' && <option value="kg">kg</option>}
          {item.unit === 'ml' && <option value="L">L</option>}
        </select>
      </td>
      <td style={{ color: '#475569', fontSize: '12px' }}>{item.priceLabel}</td>
      <td style={{ fontWeight: 600 }}>₹{item.estCost.toLocaleString('en-IN')}</td>
      <td>
        <span
          class={styles.badge}
          style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px' }}
        >
          {item.storeType}
        </span>
      </td>
      <td>
        {item.isBought ? (
          <span class={`${styles.badge} ${styles.badgeVerified}`}>✓ In Stock</span>
        ) : (
          <span class={`${styles.badge} ${styles.badgePrototype}`}>○ To Buy</span>
        )}
      </td>
    </tr>
  );
}

function ShoppingPaginationBar({
  totalCount,
  startIdx,
  endIdx,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  totalCount: number;
  startIdx: number;
  endIdx: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (p: number | ((prev: number) => number)) => void;
  onPageSizeChange: (s: number) => void;
}) {
  return (
    <div class={styles.paginationBar}>
      <span>
        Showing {totalCount === 0 ? '0' : `${startIdx}-${endIdx}`} of {totalCount} items
      </span>
      <div class={styles.pageNumbers}>
        <button
          type="button"
          class={styles.pageBtn}
          disabled={page <= 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          aria-label="Previous Page"
        >
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
          <button
            key={pNum}
            type="button"
            class={`${styles.pageBtn} ${page === pNum ? styles.pageBtnActive : ''}`}
            onClick={() => onPageChange(pNum)}
          >
            {pNum}
          </button>
        ))}
        <button
          type="button"
          class={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          aria-label="Next Page"
        >
          &gt;
        </button>
      </div>
      <select
        class={styles.pageSizeSelect}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number((e.target as HTMLSelectElement).value) || 8)}
        aria-label="Rows per page"
      >
        <option value="8">Rows per page 8</option>
        <option value="16">Rows per page 16</option>
      </select>
    </div>
  );
}

export function ShoppingEmptyState({ onBrowse }: { onBrowse: () => void }) {
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

export function ShoppingListAlerts({
  error,
  isLoading,
}: {
  error: string | null;
  isLoading: boolean;
}) {
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
