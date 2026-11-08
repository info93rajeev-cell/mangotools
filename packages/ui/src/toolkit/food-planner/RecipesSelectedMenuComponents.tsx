import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { type ExtendedFoodRecipe, getRecipeVerificationInfo } from './foodReferenceData.ts';

export function SelectedMenuPanel({
  selectedRecipes,
  guests,
  portionFactors,
  setPortionFactor,
  toggleRecipe,
  clearAllRecipes,
  onContinue,
}: {
  selectedRecipes: ExtendedFoodRecipe[];
  guests: number;
  portionFactors: Record<string, number>;
  setPortionFactor: (id: string, factor: number) => void;
  toggleRecipe: (id: string) => void;
  clearAllRecipes: () => void;
  onContinue: () => void;
}) {
  const autoBalance = () => {
    for (const r of selectedRecipes) {
      setPortionFactor(r.id, 1);
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
      />

      <PlanSummaryBanner selectedRecipes={selectedRecipes} guests={guests} />

      <button
        type="button"
        class={styles.ctaBtn}
        disabled={selectedRecipes.length === 0}
        onClick={onContinue}
      >
        Continue to Ingredients <Icon name="arrow-right" />
      </button>
    </div>
  );
}

function SelectedMenuRow({
  recipe,
  idx,
  guests,
  factor,
  onSetPortion,
  onRemove,
}: {
  recipe: ExtendedFoodRecipe;
  idx: number;
  guests: number;
  factor: number;
  onSetPortion: (id: string, factor: number) => void;
  onRemove: (id: string) => void;
}) {
  const approxPieces = Math.round(guests * factor * 2);
  const verInfo = getRecipeVerificationInfo(recipe);

  return (
    <tr>
      <td>{idx + 1}</td>
      <td>
        <div class={styles.tableItemWithThumb}>
          <img
            src={recipe.thumbnailUrl || '/food/recipes/besan-ladoo.jpg'}
            alt=""
            class={styles.tableThumb}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
            }}
          />
          <div>
            <strong>{recipe.name}</strong>
            <span
              class={`${styles.badge} ${styles[verInfo.badgeClass]}`}
              style={{ marginLeft: '6px', fontSize: '10px' }}
              title={verInfo.title}
            >
              {verInfo.label}
            </span>
          </div>
        </div>
      </td>
      <td>{guests}</td>
      <td>
        <div class={styles.stepper}>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Decrease portion for ${recipe.name}`}
            onClick={() => onSetPortion(recipe.id, Math.max(0.25, factor - 0.25))}
          >
            -
          </button>
          <span class={styles.stepperVal}>{approxPieces}</span>
          <button
            type="button"
            class={styles.stepperBtn}
            aria-label={`Increase portion for ${recipe.name}`}
            onClick={() => onSetPortion(recipe.id, factor + 0.25)}
          >
            +
          </button>
        </div>
      </td>
      <td>
        <select
          class={styles.pageSizeSelect}
          style={{ height: '26px', fontSize: '11.5px', padding: '0 4px' }}
          aria-label={`Unit for ${recipe.name}`}
        >
          <option value="pieces">pieces</option>
          <option value="kg">kg</option>
          <option value="servings">servings</option>
        </select>
      </td>
      <td>
        <button
          type="button"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#ef4444',
          }}
          title="Remove dish"
          aria-label={`Remove ${recipe.name} from menu`}
          onClick={() => onRemove(recipe.id)}
        >
          <Icon name="trash-2" />
        </button>
      </td>
    </tr>
  );
}

function SelectedMenuTable({
  recipes,
  guests,
  portionFactors,
  onSetPortion,
  onRemove,
}: {
  recipes: ExtendedFoodRecipe[];
  guests: number;
  portionFactors: Record<string, number>;
  onSetPortion: (id: string, factor: number) => void;
  onRemove: (id: string) => void;
}) {
  if (recipes.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No recipes selected yet. Pick recipes from the gallery on the left.
      </p>
    );
  }

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
          {recipes.map((recipe, idx) => (
            <SelectedMenuRow
              key={recipe.id}
              recipe={recipe}
              idx={idx}
              guests={guests}
              factor={portionFactors[recipe.id] ?? 1}
              onSetPortion={onSetPortion}
              onRemove={onRemove}
            />
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
}: {
  selectedRecipes: ExtendedFoodRecipe[];
  guests: number;
}) {
  const totalMinutes = selectedRecipes.reduce((sum, r) => sum + r.prepMinutes + r.cookMinutes, 0);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const prepTimeStr = hrs === 0 ? `${mins} min` : `~${hrs} hr ${mins} min`;
  const weightStr = (selectedRecipes.length * (guests * 0.12) + 0.5).toFixed(2);

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
            <Icon name="scale" /> Total Qty
          </span>
          <span class={styles.statValue}>~{weightStr} kg</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="clock" /> Est. Prep Time
          </span>
          <span class={styles.statValue}>{prepTimeStr}</span>
        </div>
      </div>
      <div class={styles.diwaliArtRow}>
        <span class={styles.diwaliTitle}>🪔 Diwali Special Festival Preparation</span>
        <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>
          Traditional Feast Plan
        </span>
      </div>
    </div>
  );
}
