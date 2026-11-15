import { useEffect, useRef } from 'preact/hooks';
import s from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { type ExtendedFoodRecipe, getRecipeVerificationInfo } from './foodRecipesData.ts';
import { CATALOG_INGREDIENTS } from './foodReferenceData.ts';

const KNOWN_DEAD_PATTERNS = [
  '7bN6vK5m8yA',
  '9jK8mN5vXwA',
  '8vK8mN5vXwA',
  '2r1p0g0Wq7w',
  'mAtAr',
  'FjC2g',
  'FjLw3h3iU',
  'kY8b',
  'rY8b',
  'sY8b',
  'tY8b',
  'gY8b',
  'hY8b',
  'mY8b',
  'fY8b',
  'bY8b',
  'pY8b',
  'cY8b',
  'nY8b',
  'vM8m',
  'vP8m',
  'bijoligrill.com',
  '9wolf',
  'caterspoonmumbai.com',
  '.gov.in',
  '.nic.in',
  '.res.in',
  'fliphtml5.com',
  'cani.edu.in',
  'zomato.com',
  'magicpin.in',
];

export function getSafeRecipeSourceUrl(
  source: { url: string; publisher: string; title: string },
  recipeName: string,
): string {
  const url = source.url || '';
  const urlLower = url.toLowerCase();

  // If link matches known dead patterns or hijacked domains, safely route to Google recipe search
  if (KNOWN_DEAD_PATTERNS.some((p) => urlLower.includes(p.toLowerCase()))) {
    const cleanRecipe = recipeName.replace(/\([^)]*\)/g, '').trim();
    const searchTerms = [source.publisher, source.title, cleanRecipe].filter(Boolean).join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} recipe`)}`;
  }

  if (
    urlLower.startsWith('https://www.youtube.com/') ||
    urlLower.startsWith('https://youtube.com/') ||
    urlLower.startsWith('https://en.wikipedia.org/') ||
    urlLower.startsWith('https://www.google.com/search') ||
    urlLower.startsWith('https://www.vegrecipesofindia.com/') ||
    urlLower.startsWith('https://hebbarskitchen.com/') ||
    urlLower.startsWith('https://www.tarladalal.com/') ||
    urlLower.startsWith('https://www.bongeats.com/') ||
    urlLower.startsWith('https://www.sanjeevkapoor.com/')
  ) {
    return url;
  }

  const cleanRecipe = recipeName.replace(/\([^)]*\)/g, '').trim();
  const searchTerms = [source.publisher, source.title, cleanRecipe].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} recipe`)}`;
}

export function getRecipeVideoTutorialUrl(recipe: ExtendedFoodRecipe): string {
  if (recipe.videoUrl?.includes('search_query=')) {
    return recipe.videoUrl;
  }
  const cleanName = recipe.name.replace(/\([^)]*\)/g, '').trim();
  if (
    recipe.videoUrl &&
    /(?:watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(recipe.videoUrl) &&
    !KNOWN_DEAD_PATTERNS.some((p) => recipe.videoUrl?.toLowerCase().includes(p.toLowerCase()))
  ) {
    return recipe.videoUrl;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${cleanName} authentic recipe video tutorial`,
  )}`;
}

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
              <p class={s.recipeAttributionNote}>
                Recipe instructions synthesized with culinary science and cross-referenced with
                authoritative food publishers. External videos and publications remain the
                intellectual property of their original creators.
              </p>
            </>
          )}
          <p class={s.recipeDetailCaution}>{t.recipeQuantityNote}</p>
        </div>
      )}
    </dialog>
  );
}
