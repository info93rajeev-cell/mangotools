import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodReferenceData.ts';

interface MenuVisualShowcaseProps {
  dishes: ExtendedFoodRecipe[];
  fallbackDishes?: ExtendedFoodRecipe[];
  onViewRecipe: (recipe: ExtendedFoodRecipe) => void;
  title?: string;
}

export function MenuVisualShowcase({
  dishes,
  fallbackDishes = [],
  onViewRecipe,
  title,
}: MenuVisualShowcaseProps) {
  const displayDishes = dishes.length > 0 ? dishes : fallbackDishes.slice(0, 6);
  if (displayDishes.length === 0) return null;

  return (
    <section class={styles.visualShowcaseSection} aria-label="Menu Visual Showcase">
      <div class={styles.visualShowcaseHeader}>
        <div class={styles.visualShowcaseTitleGroup}>
          <span class={styles.visualShowcaseBadge}>
            <Icon name="sparkles" />{' '}
            {title ||
              (dishes.length > 0 ? 'Today’s Menu Showcase' : 'Popular Regional Specialties')}
          </span>
          <p class={styles.visualShowcaseHint}>
            Tap any dish photo to inspect step-by-step cooking method, chef tips, and video
            tutorial.
          </p>
        </div>
      </div>
      <div class={styles.visualShowcaseTrack}>
        {displayDishes.map((dish) => (
          <button
            type="button"
            key={dish.id}
            class={styles.visualShowcaseCard}
            onClick={() => onViewRecipe(dish)}
            title={`${t.viewRecipe}: ${dish.name}`}
            aria-label={`View recipe: ${dish.name}`}
          >
            <div class={styles.visualShowcaseImgWrapper}>
              <img
                src={dish.thumbnailUrl || '/food/recipes/besan-ladoo.jpg'}
                alt={dish.name}
                class={styles.visualShowcaseImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/food/recipes/besan-ladoo.jpg';
                }}
                loading="lazy"
              />
              <span class={styles.visualShowcasePlayTag}>▶ {t.viewRecipe}</span>
            </div>
            <div class={styles.visualShowcaseMeta}>
              <strong class={styles.visualShowcaseName}>{dish.name}</strong>
              <div class={styles.visualShowcaseRow}>
                <span class={styles.visualShowcaseCourse}>{dish.course}</span>
                <span class={styles.visualShowcaseTime}>
                  ⏱ {dish.prepMinutes + dish.cookMinutes}m
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
