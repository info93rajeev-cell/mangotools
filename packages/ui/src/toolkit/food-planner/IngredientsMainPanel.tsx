import { useMemo } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { computeCategoryCounts } from './IngredientsSidebarComponents.tsx';
import {
  type IngredientsPagination,
  IngredientsPaginationBar,
  IngredientsTable,
} from './IngredientsTableComponents.tsx';
import type { IngredientLineItem } from './ingredientsUtils.ts';

export interface UseIngredientsFilterStateReturn {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  filterText: string;
  setFilterText: (t: string) => void;
  autoMerge: boolean;
  setAutoMerge: (m: boolean) => void;
  manualQuantities: Record<string, number>;
  lines: IngredientLineItem[];
  filteredLines: IngredientLineItem[];
  handleAdjustQuantity: (id: string, currentVal: number, delta: number) => void;
  handleDeleteItem: (id: string) => void;
}

export function IngredientsMainPanel({
  recipeCount,
  guests,
  filterState,
  error,
  isLoading,
  pagedLines,
  pagination,
  onEditItem,
  onBrowse,
}: {
  recipeCount: number;
  guests: number;
  filterState: UseIngredientsFilterStateReturn;
  error: string | null;
  isLoading: boolean;
  pagedLines: IngredientLineItem[];
  pagination: IngredientsPagination;
  onEditItem: (id: string) => void;
  onBrowse: () => void;
}) {
  const {
    filterText,
    setFilterText,
    autoMerge,
    setAutoMerge,
    lines,
    filteredLines,
    activeCategory,
    setActiveCategory,
    manualQuantities,
    handleAdjustQuantity,
    handleDeleteItem,
  } = filterState;

  return (
    <div class={styles.card}>
      <IngredientsPanelHeader
        recipeCount={recipeCount}
        guests={guests}
        filterText={filterText}
        onInputFilter={(t) => {
          setFilterText(t);
          pagination.setPage(1);
        }}
        autoMerge={autoMerge}
        onToggleAutoMerge={setAutoMerge}
      />

      {recipeCount === 0 ? (
        <IngredientsEmptyState onBrowse={onBrowse} />
      ) : (
        <>
          <IngredientsAlerts error={error} isLoading={isLoading} />
          <CategoryFilterBar
            lines={lines}
            activeCategory={activeCategory}
            onSelect={(cat) => {
              setActiveCategory(cat);
              pagination.setPage(1);
            }}
          />

          <IngredientsTable
            lines={pagedLines}
            guests={guests}
            manualQuantities={manualQuantities}
            onAdjustQuantity={handleAdjustQuantity}
            onDeleteItem={handleDeleteItem}
            onEditItem={onEditItem}
          />

          <IngredientsPaginationBar
            totalCount={filteredLines.length}
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

function IngredientsPanelHeader({
  recipeCount,
  guests,
  filterText,
  onInputFilter,
  autoMerge,
  onToggleAutoMerge,
}: {
  recipeCount: number;
  guests: number;
  filterText: string;
  onInputFilter: (t: string) => void;
  autoMerge: boolean;
  onToggleAutoMerge: (m: boolean) => void;
}) {
  return (
    <div class={styles.cardHeader}>
      <div class={styles.cardTitleGroup}>
        <h2 class={styles.cardTitle}>
          <Icon name="leaf" /> Ingredients (for {recipeCount} selected recipes)
        </h2>
        <p class={styles.cardSubtitle}>
          Aggregated quantities scaled for {guests} guests with allergens and aisle categorization.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          class={styles.textInput}
          style={{ maxWidth: '200px', height: '34px', fontSize: '12.5px' }}
          aria-label="Search ingredient"
          placeholder="Search ingredient..."
          value={filterText}
          onInput={(e) => onInputFilter((e.target as HTMLInputElement).value)}
        />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#475569',
            cursor: 'pointer',
          }}
          title="Automatically combine identical ingredients across dishes"
        >
          <input
            type="checkbox"
            checked={autoMerge}
            disabled
            onChange={(e) => onToggleAutoMerge((e.target as HTMLInputElement).checked)}
          />
          <span>Auto Merge</span>
        </label>
      </div>
    </div>
  );
}

function CategoryFilterBar({
  lines,
  activeCategory,
  onSelect,
}: {
  lines: IngredientLineItem[];
  activeCategory: string;
  onSelect: (cat: string) => void;
}) {
  const counts = useMemo(() => computeCategoryCounts(lines), [lines]);

  const categories = [
    { id: 'all', label: `All (${lines.length})` },
    { id: 'dry', label: `🌾 Dry (${counts.dry})` },
    { id: 'produce', label: `🥬 Produce (${counts.produce})` },
    { id: 'dairy', label: `🥛 Dairy (${counts.dairy})` },
    { id: 'spice', label: `🌶️ Spice (${counts.spice})` },
    { id: 'other', label: `📦 Other (${counts.other})` },
  ];

  return (
    <div class={styles.filterBar}>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          class={`${styles.filterPill} ${activeCategory === c.id ? styles.filterPillActive : ''}`}
          onClick={() => onSelect(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function IngredientsEmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 16px', color: '#475569' }}>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>No recipes selected</p>
      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        Pick dishes from Recipes &amp; Menu to view aggregated ingredients and scaled quantities.
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

function IngredientsAlerts({ error, isLoading }: { error: string | null; isLoading: boolean }) {
  return (
    <>
      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '12.5px',
            marginBottom: '12px',
          }}
        >
          ⚠️ {error}. Displaying preliminary scaled estimates.
        </div>
      )}
      {isLoading && (
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
          Updating exact ingredient quantities...
        </div>
      )}
    </>
  );
}
