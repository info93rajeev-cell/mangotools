import { useMemo } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { IngredientLineItem } from './ingredientsUtils.ts';

export const AISLE_GROUP_MAP: Record<string, 'dry' | 'produce' | 'dairy' | 'spice' | 'other'> = {
  grains: 'dry',
  pulses: 'dry',
  vegetables: 'produce',
  herbs: 'produce',
  dairy: 'dairy',
  spices: 'spice',
};

export function getCategoryGroup(aisle: string): 'dry' | 'produce' | 'dairy' | 'spice' | 'other' {
  return AISLE_GROUP_MAP[aisle] ?? 'other';
}

export function computeCategoryCounts(lines: IngredientLineItem[]) {
  const counts = { dry: 0, produce: 0, dairy: 0, spice: 0, other: 0 };
  for (const l of lines) {
    const group = getCategoryGroup(l.aisle);
    counts[group]++;
  }
  return counts;
}

export function IngredientsSidebar({
  lines,
  recipesCount,
  guests,
  onAdd,
  onClearAll,
  onContinue,
}: {
  lines: IngredientLineItem[];
  recipesCount: number;
  guests: number;
  onAdd: () => void;
  onClearAll: () => void;
  onContinue: () => void;
}) {
  const totalWeightKg = ingredientMass(lines);

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <h2 class={styles.cardTitle}>
          <Icon name="scale" /> Ingredient Summary
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 600 }}>
            🌱 Total Items
          </span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#14532d', marginTop: '2px' }}
          >
            {lines.length} Items
          </strong>
        </div>
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: 600 }}>
            ⚖️ {t.massIngredients}
          </span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#1e3a8a', marginTop: '2px' }}
          >
            {totalWeightKg} kg
          </strong>
        </div>
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#92400e', fontWeight: 600 }}>🥣 Recipes</span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#78350f', marginTop: '2px' }}
          >
            {recipesCount} Recipes
          </strong>
        </div>
        <div
          style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            padding: '12px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#6b21a8', fontWeight: 600 }}>👥 Servings</span>
          <strong
            style={{ fontSize: '18px', display: 'block', color: '#581c87', marginTop: '2px' }}
          >
            {guests} Servings
          </strong>
        </div>
      </div>

      <DonutCategoryBreakdown lines={lines} />

      <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center' }}
            onClick={onAdd}
          >
            <Icon name="plus" /> Add Ingredient
          </button>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center' }}
            disabled
          >
            <Icon name="shuffle" /> {t.autoMerged}
          </button>
          <button
            type="button"
            class={styles.actionBtn}
            style={{ justifyContent: 'center', color: '#b91c1c' }}
            onClick={onClearAll}
          >
            <Icon name="trash-2" /> Clear All
          </button>
        </div>
      </div>

      <button type="button" class={styles.ctaBtn} onClick={onContinue}>
        <Icon name="shopping-cart" /> Continue to Shopping List <Icon name="arrow-right" />
      </button>
    </div>
  );
}

function DonutCategoryBreakdown({ lines }: { lines: IngredientLineItem[] }) {
  const counts = useMemo(() => {
    const c = computeCategoryCounts(lines);
    return [
      { name: 'Dry', count: c.dry, color: '#f59e0b' },
      { name: 'Produce', count: c.produce, color: '#22c55e' },
      { name: 'Dairy', count: c.dairy, color: '#0284c7' },
      { name: 'Spices', count: c.spice, color: '#b91c1c' },
      { name: 'Other', count: c.other, color: '#8b5cf6' },
    ];
  }, [lines]);

  const total = lines.length || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = counts.map((c) => {
    const fraction = c.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += fraction * circumference;
    const pct = Math.round(fraction * 100);
    return { ...c, strokeDasharray, strokeDashoffset, pct };
  });

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Category Breakdown
      </h3>
      <div class={styles.donutContainer}>
        <div class={styles.donutSvgWrap}>
          <svg
            class={styles.donutSvg}
            viewBox="0 0 100 100"
            role="img"
            aria-label="Category Breakdown Donut Chart"
          >
            <title>Category Breakdown Donut Chart</title>
            {slices.map((s) => (
              <circle
                key={s.name}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                style={{
                  stroke: s.color,
                  strokeWidth: 14,
                  strokeDasharray: s.strokeDasharray,
                  strokeDashoffset: s.strokeDashoffset,
                }}
              />
            ))}
          </svg>
          <div class={styles.donutCenterLabel}>
            <span class={styles.donutCenterNumber}>{lines.length}</span>
            <span class={styles.donutCenterText}>Items</span>
          </div>
        </div>
        <div class={styles.donutLegend}>
          {slices.map((s) => (
            <div key={s.name} class={styles.donutLegendItem}>
              <span>
                <span class={styles.legendDot} style={{ background: s.color }} />
                {s.name} ({s.count})
              </span>
              <strong>{s.pct}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ingredientMass(lines: IngredientLineItem[]) {
  const totalWeightKg = lines
    .reduce(
      (sum, line) =>
        sum +
        (line.unit === 'kg'
          ? Number(line.quantity)
          : line.unit === 'g'
            ? Number(line.quantity) / 1000
            : 0),
      0,
    )
    .toFixed(2);
  return totalWeightKg;
}
