import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { computeAutoBalancedPortions, getCateringBalancedPortion } from './cateringPortions.ts';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { type ExtendedFoodRecipe, getCulinaryRegion } from './foodReferenceData.ts';
import { RecipeDetailDialog } from './RecipeDetailDialog.tsx';
import { SelectedMenuRow } from './SelectedMenuRow.tsx';

export function SelectedMenuPanel({
  selectedRecipes,
  guests,
  portionFactors,
  setPortionFactor,
  toggleRecipe,
  clearAllRecipes,
  onContinue,
  location,
  occasion,
}: {
  selectedRecipes: ExtendedFoodRecipe[];
  guests: number;
  portionFactors: Record<string, number>;
  setPortionFactor: (id: string, factor: number) => void;
  toggleRecipe: (id: string) => void;
  clearAllRecipes: () => void;
  onContinue: () => void;
  location?: string;
  occasion?: string;
}) {
  const [detailRecipe, setDetailRecipe] = useState<ExtendedFoodRecipe | null>(null);

  const autoBalance = () => {
    const balanced = computeAutoBalancedPortions(selectedRecipes);
    for (const [id, factor] of Object.entries(balanced)) {
      setPortionFactor(id, factor);
    }
  };

  return (
    <div class={styles.card}>
      <div class={styles.cardHeader}>
        <div class={styles.cardTitleGroup}>
          <h2 class={styles.cardTitle}>
            <Icon name="utensils" /> My Menu ({selectedRecipes.length} recipes)
          </h2>
          <p class={styles.cardSubtitle}>Selected dishes for {guests} guests.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {selectedRecipes.length > 0 && (
            <>
              <button
                type="button"
                class={styles.actionBtn}
                onClick={autoBalance}
                title="Auto balance portions"
              >
                <Icon name="sparkles" /> Auto Balance
              </button>
              <button type="button" class={styles.actionBtn} onClick={clearAllRecipes}>
                <Icon name="trash-2" /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      <SelectedMenuTable
        recipes={selectedRecipes}
        guests={guests}
        portionFactors={portionFactors}
        onSetPortion={setPortionFactor}
        onRemove={toggleRecipe}
        onView={setDetailRecipe}
      />

      <PlanSummaryBanner
        selectedRecipes={selectedRecipes}
        guests={guests}
        location={location}
        occasion={occasion}
      />

      <button
        type="button"
        class={styles.ctaBtn}
        disabled={selectedRecipes.length === 0}
        onClick={onContinue}
      >
        Continue to Ingredients <Icon name="arrow-right" />
      </button>

      <RecipeDetailDialog
        recipe={detailRecipe}
        servings={guests * (portionFactors[detailRecipe?.id ?? ''] ?? 1)}
        onClose={() => setDetailRecipe(null)}
      />
    </div>
  );
}

const COURSE_ORDER: Array<{ key: string; label: string; icon: string }> = [
  { key: 'bread', label: 'Breads & Roti', icon: '🫓' },
  { key: 'main', label: 'Main Curries', icon: '🍲' },
  { key: 'dal', label: 'Dal & Legumes', icon: '🍛' },
  { key: 'rice', label: 'Rice & Biryani', icon: '🍚' },
  { key: 'snack', label: 'Starters & Snacks', icon: '🥟' },
  { key: 'side', label: 'Sides & Raita', icon: '🥗' },
  { key: 'dessert', label: 'Sweets & Mithai', icon: '🧁' },
  { key: 'drink', label: 'Drinks & Beverages', icon: '☕' },
];

function SelectedMenuTable({
  recipes,
  guests,
  portionFactors,
  onSetPortion,
  onRemove,
  onView,
}: {
  recipes: ExtendedFoodRecipe[];
  guests: number;
  portionFactors: Record<string, number>;
  onSetPortion: (id: string, factor: number) => void;
  onRemove: (id: string) => void;
  onView: (recipe: ExtendedFoodRecipe) => void;
}) {
  if (recipes.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No recipes selected yet. Pick recipes from the gallery on the left.
      </p>
    );
  }

  const grouped = COURSE_ORDER.map((c) => ({
    ...c,
    items: recipes.filter((r) => r.course === c.key),
  })).filter((g) => g.items.length > 0);

  const knownKeys = new Set(COURSE_ORDER.map((c) => c.key));
  const otherItems = recipes.filter((r) => !knownKeys.has(r.course));
  if (otherItems.length > 0) {
    grouped.push({ key: 'other', label: 'Other Dishes', icon: '🍽️', items: otherItems });
  }

  let counter = 0;

  return (
    <div class={styles.tableWrapper}>
      <table class={styles.table} aria-label="Selected Dishes Table">
        <thead>
          <tr>
            <th style={{ width: '28px' }}>#</th>
            <th>Recipe</th>
            <th>Servings</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th style={{ width: '32px' }}></th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((group) => (
            <>
              <tr key={`header-${group.key}`} class={styles.courseGroupHeaderRow}>
                <td colSpan={6} class={styles.courseGroupHeaderCell}>
                  {group.icon} {group.label} ({group.items.length})
                  {group.items.length > 1 && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        fontWeight: 'normal',
                        opacity: 0.85,
                      }}
                    >
                      • Auto-scaled to{' '}
                      {Math.round(getCateringBalancedPortion(group.key, group.items.length) * 100)}%
                      per dish
                    </span>
                  )}
                </td>
              </tr>
              {group.items.map((recipe) => {
                counter += 1;
                return (
                  <SelectedMenuRow
                    key={recipe.id}
                    recipe={recipe}
                    idx={counter - 1}
                    guests={guests}
                    factor={portionFactors[recipe.id] ?? 1}
                    onSetPortion={onSetPortion}
                    onRemove={onRemove}
                    onView={onView}
                  />
                );
              })}
            </>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        class={styles.dashedBtn}
        onClick={() => {
          const el = document.querySelector(`.${styles.gallerySearchInput}`) as HTMLElement;
          el?.focus();
        }}
      >
        <Icon name="plus" /> Add More Recipes
      </button>
    </div>
  );
}

function PlanSummaryBanner({
  selectedRecipes,
  guests,
  location,
  occasion,
}: {
  selectedRecipes: ExtendedFoodRecipe[];
  guests: number;
  location?: string;
  occasion?: string;
}) {
  const totalMinutes = selectedRecipes.reduce((sum, r) => sum + r.prepMinutes + r.cookMinutes, 0);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const prepTimeStr = hrs === 0 ? `${mins} min` : `~${hrs} hr ${mins} min`;
  const region = getCulinaryRegion(location);
  const currentOccasion = occasion || region.defaultOccasion;

  return (
    <div class={styles.diwaliCard}>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#92400e',
          margin: '0 0 10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Icon name="calendar" /> Plan Summary
      </h3>
      <div class={styles.summaryStats}>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="users" /> People
          </span>
          <span class={styles.statValue}>{guests}</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="utensils" /> Recipes
          </span>
          <span class={styles.statValue}>{selectedRecipes.length}</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="scale" /> {t.baseServings}
          </span>
          <span class={styles.statValue}>
            {guests} {t.servings}
          </span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="clock" /> Est. Prep Time
          </span>
          <span class={styles.statValue}>{prepTimeStr}</span>
        </div>
      </div>
      <div class={styles.diwaliArtRow}>
        <span class={styles.diwaliTitle}>
          {region.flag} {currentOccasion} Special Preparation
        </span>
        <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
          {region.shortName} Feast Plan
        </span>
      </div>
    </div>
  );
}
