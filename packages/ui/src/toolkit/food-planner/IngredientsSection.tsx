import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP } from './foodReferenceData.ts';
import {
  extractIngredientLines,
  getAisleColor,
  type IngredientLineItem,
} from './ingredientsUtils.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface IngredientsSectionProps {
  planner: UseFoodPlannerReturn;
}

export function IngredientsSection({ planner }: IngredientsSectionProps) {
  const {
    setup,
    selectedRecipes,
    engineConsolidated,
    isLoadingConsolidated,
    consolidateError,
    setActiveSection,
  } = planner;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterText, setFilterText] = useState<string>('');

  const lines = useMemo(
    () =>
      extractIngredientLines(
        engineConsolidated,
        selectedRecipes,
        setup.guests,
        setup.servingsPerGuest,
      ),
    [engineConsolidated, selectedRecipes, setup.guests, setup.servingsPerGuest],
  );

  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      const matchText = !filterText || l.name.toLowerCase().includes(filterText.toLowerCase());
      const matchCat = activeCategory === 'all' || l.aisle === activeCategory;
      return matchText && matchCat;
    });
  }, [lines, filterText, activeCategory]);

  return (
    <div class={styles.layoutGrid}>
      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <div class={styles.cardTitleGroup}>
            <h2 class={styles.cardTitle}>
              <Icon name="leaf" /> Ingredients (for {selectedRecipes.length} selected recipes)
            </h2>
            <p class={styles.cardSubtitle}>
              Aggregated quantities scaled for {setup.guests} guests with allergens and aisle
              categorization.
            </p>
          </div>
          <input
            type="text"
            class={styles.textInput}
            style={{ maxWidth: '240px' }}
            aria-label="Search ingredient"
            placeholder="Search ingredient..."
            value={filterText}
            onInput={(e) => setFilterText((e.target as HTMLInputElement).value)}
          />
        </div>

        {selectedRecipes.length === 0 ? (
          <IngredientsEmptyState onBrowse={() => setActiveSection('recipes')} />
        ) : (
          <>
            <IngredientsAlerts error={consolidateError} isLoading={isLoadingConsolidated} />
            <CategoryFilterBar
              linesCount={lines.length}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />

            <IngredientsTable lines={filteredLines} />
          </>
        )}
      </div>

      <IngredientsSidebar
        lines={lines}
        recipesCount={selectedRecipes.length}
        guests={setup.guests}
        onContinue={() => setActiveSection('shopping')}
      />
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

function IngredientsSidebar({
  lines,
  recipesCount,
  guests,
  onContinue,
}: {
  lines: IngredientLineItem[];
  recipesCount: number;
  guests: number;
  onContinue: () => void;
}) {
  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <Icon name="scale" /> Ingredient Summary
        </h2>
      </div>

      <IngredientsSummaryStats
        totalItems={lines.length}
        recipesCount={recipesCount}
        guests={guests}
      />

      <CategoryBreakdown lines={lines} />

      <button type="button" class={styles.ctaBtn} onClick={onContinue}>
        <Icon name="shopping-cart" /> Continue to Shopping List <Icon name="arrow-right" />
      </button>
    </div>
  );
}

function CategoryFilterBar({
  linesCount,
  activeCategory,
  onSelect,
}: {
  linesCount: number;
  activeCategory: string;
  onSelect: (cat: string) => void;
}) {
  const categories = [
    { id: 'all', label: `All (${linesCount})` },
    { id: 'vegetables', label: 'Produce' },
    { id: 'pulses', label: 'Pulses' },
    { id: 'grains', label: 'Grains' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'spices', label: 'Spices' },
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

function IngredientsTable({ lines }: { lines: IngredientLineItem[] }) {
  if (lines.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No ingredients found matching the filter.
      </p>
    );
  }

  return (
    <div class={styles.tableWrapper}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '36px' }}>#</th>
            <th>Ingredient</th>
            <th>Category</th>
            <th>Scaled Quantity</th>
            <th>Used In (Recipes)</th>
            <th>Allergens</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ color: '#64748b', fontSize: '12px' }}>{idx + 1}</td>
              <td>
                <strong>{item.name}</strong>
              </td>
              <td>
                <span class={styles.badge} style={{ background: '#f1f5f9', color: '#334155' }}>
                  {AISLE_DISPLAY_MAP[item.aisle] ?? item.aisle}
                </span>
              </td>
              <td>
                <strong>{item.quantity}</strong> {item.unit}
              </td>
              <td style={{ fontSize: '12px', color: '#475569' }}>{item.usedIn.join(', ')}</td>
              <td>
                {item.allergens.length > 0 ? (
                  item.allergens.map((a) => (
                    <span key={a} class={`${styles.badge} ${styles.badgeSpice}`}>
                      ⚠️ {a}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngredientsSummaryStats({
  totalItems,
  recipesCount,
  guests,
}: {
  totalItems: number;
  recipesCount: number;
  guests: number;
}) {
  return (
    <div class={styles.summaryStats} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>Total Items</span>
        <span class={styles.statValue}>{totalItems}</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>Recipes</span>
        <span class={styles.statValue}>{recipesCount}</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>Guests</span>
        <span class={styles.statValue}>{guests}</span>
      </div>
    </div>
  );
}

function CategoryBreakdown({ lines }: { lines: IngredientLineItem[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of lines) {
      map[l.aisle] = (map[l.aisle] || 0) + 1;
    }
    return map;
  }, [lines]);

  const total = lines.length || 1;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
        Category Breakdown
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(counts).map(([aisle, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={aisle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '3px',
                }}
              >
                <span style={{ color: '#475569' }}>{AISLE_DISPLAY_MAP[aisle] ?? aisle}</span>
                <strong>
                  {count} ({pct}%)
                </strong>
              </div>
              <div
                style={{
                  height: '6px',
                  background: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: getAisleColor(aisle),
                    borderRadius: '999px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
