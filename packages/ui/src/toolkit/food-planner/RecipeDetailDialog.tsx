import { useEffect, useRef } from 'preact/hooks';
import s from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { type ExtendedFoodRecipe, getRecipeVerificationInfo } from './foodRecipesData.ts';
import { CATALOG_INGREDIENTS } from './foodReferenceData.ts';

export function scaledRecipeQuantity(
  quantity: string,
  unit: string,
  servings: number,
  baseServings: number,
): string {
  const scaled = (Number(quantity) * servings) / baseServings;
  if (!Number.isFinite(scaled) || scaled <= 0) return `${quantity} ${unit}`;
  const displayUnit =
    unit === 'g' && scaled >= 1000 ? 'kg' : unit === 'ml' && scaled >= 1000 ? 'l' : unit;
  const displayValue = displayUnit === unit ? scaled : scaled / 1000;
  return `${Number(displayValue.toFixed(2))} ${displayUnit}`;
}

interface RecipeDetailDialogProps {
  recipe: ExtendedFoodRecipe | null;
  servings: number;
  onClose: () => void;
}

export function RecipeDetailDialog({ recipe, servings, onClose }: RecipeDetailDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (recipe && element && !element.open) element.showModal();
    if (!recipe && element?.open) element.close();
  }, [recipe]);

  return (
    <dialog ref={dialog} class={s.recipeDetailDialog} onClose={onClose} aria-label={recipe?.name}>
      {recipe && (
        <div class={s.recipeDetailBody}>
          <button type="button" class={s.recipeDetailClose} onClick={() => dialog.current?.close()}>
            {t.closeRecipe}
          </button>
          {recipe.thumbnailUrl && (
            <img class={s.recipeDetailImage} src={recipe.thumbnailUrl} alt={recipe.name} />
          )}
          <h2>{recipe.name}</h2>
          <p>
            {getRecipeVerificationInfo(recipe).label} · {recipe.prepMinutes} min {t.prep} ·{' '}
            {recipe.cookMinutes} min {t.cook}
          </p>
          {recipe.imageProvenance && (
            <p class={s.recipeImageDisclosure}>{recipe.imageProvenance.notes}</p>
          )}
          <h3>
            {t.recipeIngredients} · {servings} {t.servings}
          </h3>
          <ul class={s.recipeDetailIngredients}>
            {recipe.ingredients.map((item, index) => (
              <li key={`${item.ingredient}-${index}`}>
                <span>
                  {CATALOG_INGREDIENTS.find((ingredient) => ingredient.id === item.ingredient)
                    ?.name ?? item.ingredient}
                  {item.note && <small class={s.recipeIngredientNote}> ({item.note})</small>}
                </span>
                <strong>
                  {scaledRecipeQuantity(item.quantity, item.unit, servings, recipe.servings)}
                </strong>
              </li>
            ))}
          </ul>
          <h3>{t.recipeMethod}</h3>
          <ol class={s.recipeDetailSteps}>
            {recipe.steps.map((step, index) => {
              const match = step.match(/^(\[[^\]]+\])\s*(.*)$/);
              if (match) {
                return (
                  <li key={index}>
                    <strong class={s.recipeStepPhase}>{match[1]}</strong> {match[2]}
                  </li>
                );
              }
              return <li key={index}>{step}</li>;
            })}
          </ol>
          {recipe.sources && recipe.sources.length > 0 && (
            <>
              <h3>{t.recipeSources}</h3>
              <ul>
                {recipe.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.publisher}: {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p class={s.recipeDetailCaution}>{t.recipeQuantityNote}</p>
        </div>
      )}
    </dialog>
  );
}
