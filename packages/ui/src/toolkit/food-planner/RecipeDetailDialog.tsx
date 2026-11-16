import { useEffect, useRef } from 'preact/hooks';
import s from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { type ExtendedFoodRecipe, getRecipeVerificationInfo } from './foodRecipesData.ts';
import { CATALOG_INGREDIENTS } from './foodReferenceData.ts';
import {
  getRecipeVideoTutorialUrl,
  getSafeRecipeSourceUrl,
  KNOWN_DEAD_PATTERNS,
  scaledRecipeQuantity,
} from './recipeLinkHelpers.ts';

export {
  getRecipeVideoTutorialUrl,
  getSafeRecipeSourceUrl,
  KNOWN_DEAD_PATTERNS,
  scaledRecipeQuantity,
};

interface RecipeDetailDialogProps {
  recipe: ExtendedFoodRecipe | null;
  servings: number;
  onClose: () => void;
}

export function RecipeDetailDialog({ recipe, servings, onClose }: RecipeDetailDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (recipe && element && !element.open) {
      if (typeof element.showModal === 'function') {
        element.showModal();
      } else {
        element.setAttribute('open', '');
      }
    }
    if (!recipe && element?.open) {
      if (typeof element.close === 'function') {
        element.close();
      } else {
        element.removeAttribute('open');
      }
    }
  }, [recipe]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-dismiss
    <dialog
      ref={dialog}
      class={s.recipeDetailDialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) {
          dialog.current?.close();
        }
      }}
      aria-label={recipe?.name}
    >
      {recipe && (
        <RecipeDetailContent
          recipe={recipe}
          servings={servings}
          onClose={() => dialog.current?.close()}
        />
      )}
    </dialog>
  );
}

function RecipeDetailContent({
  recipe,
  servings,
  onClose,
}: {
  recipe: ExtendedFoodRecipe;
  servings: number;
  onClose: () => void;
}) {
  return (
    <div class={s.recipeDetailBody}>
      <button
        type="button"
        class={s.recipeDetailClose}
        onClick={onClose}
        aria-label={t.closeRecipe}
      >
        ✕ {t.closeRecipe}
      </button>
      <RecipeDetailHeader recipe={recipe} />
      <RecipeDetailIngredients recipe={recipe} servings={servings} />
      <RecipeDetailStepsAndSources recipe={recipe} />
      <p class={s.recipeDetailCaution}>{t.recipeQuantityNote}</p>
    </div>
  );
}

function RecipeDetailHeader({ recipe }: { recipe: ExtendedFoodRecipe }) {
  return (
    <>
      {recipe.thumbnailUrl && (
        <img class={s.recipeDetailImage} src={recipe.thumbnailUrl} alt={recipe.name} />
      )}
      <h2>{recipe.name}</h2>
      <p>
        {getRecipeVerificationInfo(recipe).label} · {recipe.prepMinutes} min {t.prep} ·{' '}
        {recipe.cookMinutes} min {t.cook}
      </p>
      {((recipe.events && recipe.events.length > 0) ||
        (recipe.countries && recipe.countries.length > 0)) && (
        <div class={s.recipeMetadataBadges}>
          {recipe.events?.map((ev) => (
            <span key={ev} class={s.recipeEventBadge}>
              #{ev}
            </span>
          ))}
          {recipe.countries?.map((c) => (
            <span key={c} class={s.recipeCountryBadge}>
              {c}
            </span>
          ))}
        </div>
      )}
      <div class={s.recipeDetailActions}>
        <a
          href={getRecipeVideoTutorialUrl(recipe)}
          target="_blank"
          rel="noopener noreferrer"
          class={s.recipeDetailVideoBtn}
        >
          ▶ Watch Video Tutorial
        </a>
      </div>
      {recipe.imageProvenance && (
        <p class={s.recipeImageDisclosure}>{recipe.imageProvenance.notes}</p>
      )}
      {recipe.proTips && recipe.proTips.length > 0 && (
        <div class={s.recipeProTipsCard}>
          <h4 class={s.recipeProTipsTitle}>💡 Chef's Secrets &amp; Practical Tips</h4>
          <ul class={s.recipeProTipsList}>
            {recipe.proTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function RecipeDetailIngredients({
  recipe,
  servings,
}: {
  recipe: ExtendedFoodRecipe;
  servings: number;
}) {
  return (
    <>
      <h3>
        {t.recipeIngredients} · {servings} {t.servings}
      </h3>
      <ul class={s.recipeDetailIngredients}>
        {recipe.ingredients.map((item, index) => (
          <li key={`${item.ingredient}-${index}`}>
            <span>
              {CATALOG_INGREDIENTS.find((ingredient) => ingredient.id === item.ingredient)?.name ??
                item.ingredient}
              {item.note && <small class={s.recipeIngredientNote}> ({item.note})</small>}
            </span>
            <strong>
              {scaledRecipeQuantity(item.quantity, item.unit, servings, recipe.servings)}
            </strong>
          </li>
        ))}
      </ul>
    </>
  );
}

function RecipeDetailStepsAndSources({ recipe }: { recipe: ExtendedFoodRecipe }) {
  return (
    <>
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
                <a
                  href={getSafeRecipeSourceUrl(source, recipe.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.publisher}: {source.title}
                </a>
              </li>
            ))}
          </ul>
          <div class={s.creatorAppreciationCard}>
            <div class={s.creatorAppreciationHeader}>
              <span class={s.creatorAppreciationIcon}>🙏</span>
              <strong>Heartfelt Chef &amp; Creator Appreciation</strong>
            </div>
            <p class={s.creatorAppreciationText}>
              We gratefully acknowledge and thank master chefs, home culinary creators, and food
              publishers (including Chef Ranveer Brar, Chef Sanjeev Kapoor, Tarla Dalal, Dassana
              Amit, Hebbar&apos;s Kitchen, and traditional regional kitchen custodians) whose
              authentic techniques, verified recipes, and instructional video guides preserve our
              rich culinary heritage. Please support and subscribe to their official channels and
              publications!
            </p>
          </div>
          <p class={s.recipeAttributionNote}>
            Recipe instructions synthesized with culinary science and cross-referenced with
            authoritative food publishers. External videos and publications remain the intellectual
            property of their original creators.
          </p>
        </>
      )}
    </>
  );
}
