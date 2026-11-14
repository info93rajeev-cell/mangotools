import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export function matchesCourseFilter(recipeCourse: string, activeCourse: string): boolean {
  if (activeCourse === 'all') return true;
  if (activeCourse === 'breads') return recipeCourse === 'bread';
  if (activeCourse === 'rice') return recipeCourse === 'rice';
  if (activeCourse === 'dal') return recipeCourse === 'dal';
  if (activeCourse === 'sweets') return recipeCourse === 'dessert';
  if (activeCourse === 'snacks') return recipeCourse === 'snack';
  if (activeCourse === 'main') return recipeCourse === 'main' || recipeCourse === 'dal';
  if (activeCourse === 'sides') return recipeCourse === 'side';
  if (activeCourse === 'beverages') return recipeCourse === 'drink';
  return recipeCourse === activeCourse;
}

const COURSE_BUTTONS = [
  { key: 'all', label: t.all },
  { key: 'breads', label: '🫓 Breads & Roti' },
  { key: 'main', label: `🍲 ${t.mainCourse}` },
  { key: 'dal', label: '🍛 Dal & Legumes' },
  { key: 'rice', label: '🍚 Rice & Biryani' },
  { key: 'snacks', label: `🥟 ${t.snacks}` },
  { key: 'sides', label: '🥗 Sides' },
  { key: 'sweets', label: `🧁 ${t.sweets}` },
  { key: 'beverages', label: `☕ ${t.beverages}` },
] as const;

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
  const getBadgeCount = (key: string) =>
    key === 'all'
      ? catalogRecipes.length
      : catalogRecipes.filter((r) => matchesCourseFilter(r.course, key)).length;

  return (
    <div class={styles.cardHeader} style={{ marginBottom: '14px', alignItems: 'center' }}>
      <div class={styles.filterBar} style={{ margin: 0 }}>
        {COURSE_BUTTONS.map(({ key, label }) => {
          const isActive = !favoritesOnly && activeCourse === key;
          return (
            <button
              key={key}
              type="button"
              class={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
              onClick={() => onSelect(key)}
            >
              {label} ({getBadgeCount(key)})
            </button>
          );
        })}
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
