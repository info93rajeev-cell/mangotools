import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export function matchesCourseFilter(recipeCourse: string, activeCourse: string): boolean {
  if (activeCourse === 'all') return true;
  if (activeCourse === 'sweets') return recipeCourse === 'dessert';
  if (activeCourse === 'snacks') return recipeCourse === 'snack';
  if (activeCourse === 'main') {
    return recipeCourse === 'main' || recipeCourse === 'dal' || recipeCourse === 'rice';
  }
  if (activeCourse === 'sides') {
    return recipeCourse === 'side';
  }
  if (activeCourse === 'beverages') {
    return recipeCourse === 'drink';
  }
  return recipeCourse === activeCourse;
}

export function CourseFilterBar({
  catalogRecipes,
  activeCourse,
  favoritesOnly,
  favoritesCount,
  onSelect,
  onSelectFavorites,
}: {
  catalogRecipes: ExtendedFoodRecipe[];
  activeCourse: string;
  favoritesOnly: boolean;
  favoritesCount: number;
  onSelect: (c: string) => void;
  onSelectFavorites: () => void;
}) {
  const count = (course: string) =>
    catalogRecipes.filter((recipe) => matchesCourseFilter(recipe.course, course)).length;

  return (
    <div class={styles.cardHeader} style={{ marginBottom: '14px', alignItems: 'center' }}>
      <div class={styles.filterBar} style={{ margin: 0 }}>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'all' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('all')}
        >
          {t.all} ({catalogRecipes.length})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'sweets' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('sweets')}
        >
          🧁 {t.sweets} ({count('sweets')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'snacks' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('snacks')}
        >
          🥟 {t.snacks} ({count('snacks')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'main' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('main')}
        >
          🍲 {t.mainCourse} ({count('main')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'sides' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('sides')}
        >
          🥗 Sides ({count('sides')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'beverages' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('beverages')}
        >
          ☕ {t.beverages} ({count('beverages')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${favoritesOnly ? styles.filterPillActive : ''}`}
          onClick={onSelectFavorites}
        >
          ⭐ {t.favorites} ({favoritesCount})
        </button>
      </div>
    </div>
  );
}
