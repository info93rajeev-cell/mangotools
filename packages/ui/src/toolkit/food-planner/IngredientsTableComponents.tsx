import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import { getAisleColor, type IngredientLineItem } from './ingredientsUtils.ts';

export interface IngredientsPagination {
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalPages: number;
  startIdx: number;
  endIdx: number;
}

export function IngredientsTable({
  lines,
  guests,
  manualQuantities,
  onAdjustQuantity,
  onDeleteItem,
}: {
  lines: IngredientLineItem[];
  guests: number;
  manualQuantities: Record<string, number>;
  onAdjustQuantity: (id: string, currentVal: number, delta: number) => void;
  onDeleteItem: (id: string) => void;
}) {
  if (lines.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No ingredients found matching the filter.
      </p>
    );
  }

  return (
    <div class={styles.tableWrapper}>
      <table class={styles.table} aria-label="Aggregated Ingredients Table">
        <thead>
          <tr>
            <th style={{ width: '28px' }}>#</th>
            <th>Ingredient</th>
            <th>Category</th>
            <th>Total Quantity (for {guests} servings)</th>
            <th>Prep / Form</th>
            <th>Used In (Recipes)</th>
            <th style={{ width: '60px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((item, idx) => (
            <IngredientTableRow
              key={item.id}
              item={item}
              idx={idx}
              manualVal={manualQuantities[item.id]}
              onAdjustQuantity={onAdjustQuantity}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngredientTableRow({
  item,
  idx,
  manualVal,
  onAdjustQuantity,
  onDeleteItem,
}: {
  item: IngredientLineItem;
  idx: number;
  manualVal?: number;
  onAdjustQuantity: (id: string, currentVal: number, delta: number) => void;
  onDeleteItem: (id: string) => void;
}) {
  const rawVal = Number.parseFloat(item.quantity) || 1;
  const displayVal = manualVal ?? rawVal;
  const stepDelta = item.unit === 'piece' ? 1 : 0.25;
  const aisleColor = getAisleColor(item.aisle);
  const aisleLabel = AISLE_DISPLAY_MAP[item.aisle] ?? item.aisle;

  return (
    <tr>
      <td style={{ color: '#64748b', fontSize: '12px' }}>{idx + 1}</td>
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
            aria-label={`Decrease ${item.name}`}
            onClick={() => onAdjustQuantity(item.id, rawVal, -stepDelta)}
          >
            -
          </button>
          <span class={styles.stepperVal}>{displayVal.toFixed(displayVal % 1 === 0 ? 0 : 2)}</span>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Increase ${item.name}`}
            onClick={() => onAdjustQuantity(item.id, rawVal, stepDelta)}
          >
            +
          </button>
          <select
            class={styles.pageSizeSelect}
            style={{ height: '26px', fontSize: '11px', marginLeft: '4px' }}
            aria-label={`Unit for ${item.name}`}
          >
            <option value={item.unit}>{item.unit}</option>
            {item.unit === 'g' && <option value="kg">kg</option>}
            {item.unit === 'ml' && <option value="L">L</option>}
          </select>
        </div>
      </td>
      <td style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
        {item.prepForm || 'Standard'}
      </td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {item.usedIn.map((recipeName) => (
            <span
              key={recipeName}
              class={styles.badge}
              style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px' }}
            >
              {recipeName}
            </span>
          ))}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#64748b',
            }}
            title="Edit ingredient"
            aria-label={`Edit ${item.name}`}
          >
            <Icon name="pencil" />
          </button>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#ef4444',
            }}
            title="Delete ingredient"
            aria-label={`Delete ${item.name}`}
            onClick={() => onDeleteItem(item.id)}
          >
            <Icon name="trash-2" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function IngredientsPaginationBar({
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
