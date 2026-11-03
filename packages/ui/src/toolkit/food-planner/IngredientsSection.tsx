import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { AISLE_DISPLAY_MAP, CATALOG_INGREDIENTS } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface IngredientsSectionProps {
  planner: UseFoodPlannerReturn;
}

interface IngredientLineItem {
  id: string;
  name: string;
  aisle: string;
  quantity: string;
  unit: string;
  usedIn: string[];
  allergens: string[];
}

export function IngredientsSection({ planner }: IngredientsSectionProps) {
  const { setup, selectedRecipes, engineConsolidated, setActiveSection } = planner;
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
            placeholder="Search ingredient..."
            value={filterText}
            onInput={(e) => setFilterText((e.target as HTMLInputElement).value)}
          />
        </div>

        <CategoryFilterBar
          linesCount={lines.length}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <IngredientsTable lines={filteredLines} />
      </div>

      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <h2 class={styles.cardTitle}>
            <Icon name="scale" /> Ingredient Summary
          </h2>
        </div>

        <IngredientsSummaryStats
          totalItems={lines.length}
          recipesCount={selectedRecipes.length}
          guests={setup.guests}
        />

        <CategoryBreakdown lines={lines} />

        <button type="button" class={styles.ctaBtn} onClick={() => setActiveSection('shopping')}>
          <Icon name="shopping-cart" /> Continue to Shopping List <Icon name="arrow-right" />
        </button>
      </div>
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
  return (
    <div class={styles.filterBar}>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCategory === 'all' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('all')}
      >
        All ({linesCount})
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCategory === 'vegetables' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('vegetables')}
      >
        Vegetables
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCategory === 'grains' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('grains')}
      >
        Grains & Rice
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCategory === 'spices' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('spices')}
      >
        Spices
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCategory === 'dairy' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('dairy')}
      >
        Dairy
      </button>
    </div>
  );
}

function IngredientsTable({ lines }: { lines: IngredientLineItem[] }) {
  return (
    <div class={styles.tableWrapper}>
      <table class={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Ingredient</th>
            <th>Category</th>
            <th>Total Qty</th>
            <th>Used In</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
                No ingredients match the selected filter.
              </td>
            </tr>
          ) : (
            lines.map((line, idx) => (
              <tr key={line.id}>
                <td>{idx + 1}</td>
                <td>
                  <strong>{line.name}</strong>
                  {line.allergens.length > 0 && (
                    <span
                      class={`${styles.badge} ${styles.badgeSpice}`}
                      style={{ marginLeft: '6px' }}
                      title={`Contains: ${line.allergens.join(', ')}`}
                    >
                      ⚠️ {line.allergens.join(', ')}
                    </span>
                  )}
                </td>
                <td>
                  <span class={`${styles.badge} ${getAisleBadgeClass(line.aisle)}`}>
                    {AISLE_DISPLAY_MAP[line.aisle] ?? line.aisle}
                  </span>
                </td>
                <td>
                  <strong>{line.quantity}</strong> {line.unit}
                </td>
                <td>
                  <span style={{ fontSize: '11.5px', color: '#475569' }}>
                    {line.usedIn.join(', ')}
                  </span>
                </td>
              </tr>
            ))
          )}
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
    <div class={styles.summaryStats} style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>
          <Icon name="leaf" /> Total Items
        </span>
        <span class={styles.statValue}>{totalItems}</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>
          <Icon name="scale" /> Total Weight
        </span>
        <span class={styles.statValue}>~{(totalItems * 0.45).toFixed(1)} kg</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>
          <Icon name="utensils" /> Recipes
        </span>
        <span class={styles.statValue}>{recipesCount}</span>
      </div>
      <div
        class={styles.statItem}
        style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}
      >
        <span class={styles.statLabel}>
          <Icon name="users" /> Servings
        </span>
        <span class={styles.statValue}>{guests}</span>
      </div>
    </div>
  );
}

function CategoryBreakdown({ lines }: { lines: IngredientLineItem[] }) {
  const counts: Record<string, number> = {};
  for (const l of lines) counts[l.aisle] = (counts[l.aisle] ?? 0) + 1;
  const total = lines.length || 1;
  const stats = Object.entries(counts).map(([aisle, count]) => ({
    aisle,
    name: AISLE_DISPLAY_MAP[aisle] ?? aisle,
    count,
    percent: Math.round((count / total) * 100),
  }));

  return (
    <div style={{ marginTop: '18px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>
        Category Breakdown
      </h3>
      <div class={styles.categoryBreakdown}>
        {stats.map((cat) => (
          <div key={cat.aisle}>
            <div class={styles.breakdownRow}>
              <span>{cat.name}</span>
              <strong>
                {cat.count} items ({cat.percent}%)
              </strong>
            </div>
            <div class={styles.progressBarBg}>
              <div
                class={styles.progressBarFill}
                style={{ width: `${cat.percent}%`, background: getAisleColor(cat.aisle) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function extractIngredientLines(
  engineConsolidated: unknown,
  selectedRecipes: Array<{
    id: string;
    name: string;
    servings: number;
    ingredients: Array<{ ingredient: string; quantity: string; unit: string }>;
  }>,
  guests: number,
  servingsPerGuest: number,
): IngredientLineItem[] {
  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));

  if (!cons?.lines) {
    const agg = new Map<string, { total: number; unit: string; usedIn: Set<string> }>();
    for (const recipe of selectedRecipes) {
      const factor = (guests * servingsPerGuest) / recipe.servings;
      for (const ing of recipe.ingredients) {
        const entry = agg.get(ing.ingredient) ?? { total: 0, unit: ing.unit, usedIn: new Set() };
        entry.total += Number.parseFloat(ing.quantity) * factor;
        entry.usedIn.add(recipe.name);
        agg.set(ing.ingredient, entry);
      }
    }
    return Array.from(agg.entries()).map(([ingId, data]) => {
      const cat = catalogMap.get(ingId);
      return {
        id: ingId,
        name: cat?.name ?? ingId,
        aisle: cat?.aisle ?? 'other',
        quantity: formatDisplayQty(data.total, data.unit),
        unit: formatDisplayUnit(data.total, data.unit),
        usedIn: Array.from(data.usedIn),
        allergens: cat?.allergens ?? [],
      };
    });
  }

  return cons.lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const usedIn = selectedRecipes
      .filter((r) => r.ingredients.some((i) => i.ingredient === l.ingredient))
      .map((r) => r.name);
    const num = Number.parseFloat(l.total);
    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      quantity: formatDisplayQty(num, l.unit),
      unit: formatDisplayUnit(num, l.unit),
      usedIn,
      allergens: cat?.allergens ?? [],
    };
  });
}

function formatDisplayQty(val: number, unit: string): string {
  if (unit === 'g' && val >= 1000) return (val / 1000).toFixed(2);
  if (unit === 'ml' && val >= 1000) return (val / 1000).toFixed(2);
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

function formatDisplayUnit(val: number, unit: string): string {
  if (unit === 'g' && val >= 1000) return 'kg';
  if (unit === 'ml' && val >= 1000) return 'L';
  return unit;
}

function getAisleBadgeClass(aisle: string): string {
  if (aisle === 'vegetables' || aisle === 'herbs') return styles.badgeProduce;
  if (aisle === 'dairy') return styles.badgeDairy;
  if (aisle === 'spices') return styles.badgeSpice;
  if (aisle === 'grains' || aisle === 'pulses') return styles.badgeDry;
  return styles.badgeOther;
}

function getAisleColor(aisle: string): string {
  if (aisle === 'vegetables' || aisle === 'herbs') return '#22c55e';
  if (aisle === 'dairy') return '#0284c7';
  if (aisle === 'spices') return '#ef4444';
  if (aisle === 'grains' || aisle === 'pulses') return '#f59e0b';
  return '#8b5cf6';
}
