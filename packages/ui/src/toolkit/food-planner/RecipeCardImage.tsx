import { useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import type { ExtendedFoodRecipe } from './foodReferenceData.ts';

export function getCourseIcon(course: string): string {
  switch (course) {
    case 'rice':
      return '🍚';
    case 'dal':
      return '🍲';
    case 'main':
      return '🍛';
    case 'side':
      return '🥗';
    case 'snack':
      return '🥟';
    case 'dessert':
      return '🍨';
    case 'bread':
      return '🫓';
    case 'drink':
      return '🥤';
    default:
      return '🍽️';
  }
}

export function getCoursePlaceholderClass(course: string): string {
  switch (course) {
    case 'rice':
      return styles.placeholderRice;
    case 'dal':
      return styles.placeholderDal;
    case 'main':
      return styles.placeholderMain;
    case 'side':
      return styles.placeholderSide;
    case 'snack':
      return styles.placeholderSnack;
    case 'dessert':
      return styles.placeholderDessert;
    default:
      return styles.placeholderDefault;
  }
}

interface RecipeCardImageProps {
  recipe: ExtendedFoodRecipe;
}

export function RecipeCardImage({ recipe }: RecipeCardImageProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(recipe.thumbnailUrl) && !imgFailed;

  return (
    <div
      class={`${styles.recipeImageHolder} ${getCoursePlaceholderClass(recipe.course)}`}
      data-testid={`recipe-image-${recipe.id}`}
    >
      {showImage ? (
        <img
          src={recipe.thumbnailUrl}
          alt={
            recipe.imageProvenance?.type === 'ai-generated'
              ? `${t.generatedRecipeImage} ${recipe.name}`
              : recipe.name
          }
          class={styles.recipeImg}
          loading="lazy"
          onError={() => setImgFailed(true)}
          title={
            recipe.imageProvenance?.type === 'ai-generated'
              ? `${recipe.name} (AI-generated visual preview)`
              : recipe.name
          }
        />
      ) : (
        <div class={styles.recipePlaceholder} data-testid={`recipe-placeholder-${recipe.id}`}>
          <span class={styles.placeholderIcon} aria-hidden="true">
            {getCourseIcon(recipe.course)}
          </span>
          <span class={styles.placeholderBadge}>Image coming soon</span>
        </div>
      )}
    </div>
  );
}
