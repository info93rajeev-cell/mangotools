import type { DietaryOption } from './dietaryFilter.ts';
import styles from './foodPlanner.module.css';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export type { DietaryOption };

interface DietaryFilterBarProps {
  catalogRecipes: ExtendedFoodRecipe[];
  activeDiet: DietaryOption;
  onSelectDiet: (diet: DietaryOption) => void;
}

export function DietaryFilterBar({
  catalogRecipes,
  activeDiet,
  onSelectDiet,
}: DietaryFilterBarProps) {
  const total = catalogRecipes.length;
  const vegCount = catalogRecipes.filter(
    (r) => r.diet === 'vegetarian' || r.diet === 'vegan' || r.diet === 'jain',
  ).length;
  const nonVegCount = catalogRecipes.filter(
    (r) => r.diet === 'non-vegetarian' || r.diet === 'eggetarian',
  ).length;
  const veganCount = catalogRecipes.filter((r) => r.diet === 'vegan').length;
  const jainCount = catalogRecipes.filter((r) => r.diet === 'jain').length;

  return (
    <nav
      aria-label="Dietary Preferences"
      class={styles.filterBar}
      style={{
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <button
        type="button"
        class={`${styles.filterPill} ${activeDiet === 'all' ? styles.filterPillActive : ''}`}
        onClick={() => onSelectDiet('all')}
      >
        ✨ All ({total})
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeDiet === 'veg' ? styles.filterPillActive : ''}`}
        onClick={() => onSelectDiet('veg')}
      >
        🟢 Pure Veg ({vegCount})
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeDiet === 'non-veg' ? styles.filterPillActive : ''}`}
        onClick={() => onSelectDiet('non-veg')}
      >
        🔴 Non-Veg ({nonVegCount})
      </button>
      {veganCount > 0 && (
        <button
          type="button"
          class={`${styles.filterPill} ${activeDiet === 'vegan' ? styles.filterPillActive : ''}`}
          onClick={() => onSelectDiet('vegan')}
        >
          🌿 Vegan ({veganCount})
        </button>
      )}
      {jainCount > 0 && (
        <button
          type="button"
          class={`${styles.filterPill} ${activeDiet === 'jain' ? styles.filterPillActive : ''}`}
          onClick={() => onSelectDiet('jain')}
        >
          🪷 Jain ({jainCount})
        </button>
      )}
    </nav>
  );
}
