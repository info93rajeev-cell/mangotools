import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodReferenceData.ts';
import { RecipeCardImage } from './RecipeCardImage.tsx';

interface RecipeGalleryCardProps {
  recipe: ExtendedFoodRecipe;
  isAdded: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onToggle: () => void;
  onView: () => void;
}

export function RecipeGalleryCard({
  recipe,
  isAdded,
  isFavorited,
  onToggleFavorite,
  onToggle,
  onView,
}: RecipeGalleryCardProps) {
  const isAwaiting = Boolean(recipe.awaitingData);
  return (
    <div class={styles.recipeCard}>
      <div style={{ position: 'relative' }}>
        <RecipeCardImage recipe={recipe} />
        {!isAwaiting && (
          <button
            type="button"
            class={styles.recipeViewBtn}
            onClick={onView}
            aria-label={`${t.viewRecipe}: ${recipe.name}`}
          >
            {t.viewRecipe}
          </button>
        )}
        <button
          type="button"
          class={styles.favBtn}
          style={{ color: isFavorited ? '#ef4444' : '#94a3b8' }}
          onClick={onToggleFavorite}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={`Favorite ${recipe.name}`}
          aria-pressed={isFavorited}
        >
          <Icon name="heart" />
        </button>
      </div>
      <div class={styles.recipeMeta}>
        <h3 class={styles.recipeName} title={recipe.name}>
          {recipe.name}
        </h3>
        <div class={styles.recipeInfoRow}>
          <span>⏱ {recipe.prepMinutes + recipe.cookMinutes} min</span>
          <span>•</span>
          <span title={t.baseServings}>
            👥 {recipe.servings}
            <span class="sr-only"> {t.baseServings}</span>
          </span>
        </div>
      </div>
      {isAwaiting ? (
        <button type="button" class={styles.addRecipeBtn} disabled>
          {t.awaitingTrials}
        </button>
      ) : (
        <button
          type="button"
          class={`${styles.addRecipeBtn} ${isAdded ? styles.addRecipeBtnAdded : ''}`}
          onClick={onToggle}
        >
          {isAdded ? (
            <>
              <Icon name="check" /> Added
            </>
          ) : (
            <>
              <Icon name="plus" /> Add
            </>
          )}
        </button>
      )}
    </div>
  );
}
