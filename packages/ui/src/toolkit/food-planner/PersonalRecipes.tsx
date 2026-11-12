import { useState } from 'preact/hooks';
import s from './foodPlannerMobile.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_INGREDIENTS, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

type RecipeLine = ExtendedFoodRecipe['ingredients'][number];
const firstIngredient = CATALOG_INGREDIENTS[0];
const initialLine = (): RecipeLine => ({
  ingredient: firstIngredient.id,
  quantity: '100',
  unit: 'g',
});

export function PersonalRecipes({ planner }: { planner: UseFoodPlannerReturn }) {
  const [editing, setEditing] = useState<ExtendedFoodRecipe | 'new' | null>(null);
  return (
    <section class={s.mobileCard} data-testid="personal-recipes">
      <h4 class={s.mobileCardTitle}>{t.myRecipes}</h4>
      <p class={s.mobileCardSubtitle}>{t.personalNote}</p>
      {planner.personalRecipes.map((recipe) => (
        <div class={s.mobileDishItem} key={recipe.id}>
          <div class={s.mobileDishInfo}>
            <strong>{recipe.name}</strong>
            <p>
              {recipe.servings} {t.servings}
            </p>
          </div>
          <button type="button" class={s.mobileSecondaryBtn} onClick={() => setEditing(recipe)}>
            {t.edit}
          </button>
          <button
            type="button"
            class={s.mobilePrimaryBtn}
            aria-label={`${t.addToMenu}: ${recipe.name}`}
            onClick={() => planner.toggleRecipe(recipe.id)}
          >
            {planner.selectedRecipeIds.has(recipe.id) ? t.removeFromMenu : t.addToMenu}
          </button>
          <button
            type="button"
            class={s.mobileSecondaryBtn}
            aria-label={`${t.remove}: ${recipe.name}`}
            onClick={() => removePersonalRecipe(planner, recipe.id)}
          >
            {t.remove}
          </button>
        </div>
      ))}
      {!planner.personalRecipes.length && <p>{t.personalEmpty}</p>}
      {!editing && (
        <button
          type="button"
          class={s.mobileSecondaryBtn}
          disabled={planner.personalRecipes.length >= 10}
          onClick={() => setEditing('new')}
        >
          {t.createRecipe}
        </button>
      )}
      {planner.personalRecipes.length >= 10 && <p>{t.personalLimit}</p>}
      {editing && (
        <PersonalRecipeForm
          key={editing === 'new' ? 'new' : editing.id}
          recipe={editing === 'new' ? undefined : editing}
          planner={planner}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function PersonalRecipeForm({
  recipe,
  planner,
  onClose,
}: {
  recipe?: ExtendedFoodRecipe;
  planner: UseFoodPlannerReturn;
  onClose: () => void;
}) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 4));
  const [prep, setPrep] = useState(String(recipe?.prepMinutes ?? 10));
  const [cook, setCook] = useState(String(recipe?.cookMinutes ?? 20));
  const [instructions, setInstructions] = useState(recipe?.steps.join('\n') ?? '');
  const [lines, setLines] = useState<RecipeLine[]>(recipe?.ingredients ?? [initialLine()]);
  const [error, setError] = useState('');
  const save = () => {
    if (!validRecipe(name, servings, prep, cook, instructions, lines)) {
      setError(t.recipeError);
      return;
    }
    const next = personalRecipe(
      recipe,
      [name, servings, prep, cook, instructions],
      lines,
      planner.personalRecipes,
    );
    planner.setPersonalRecipes((recipes) => [...recipes.filter((r) => r.id !== next.id), next]);
    resetRecipeProgress(planner, next.id);
    onClose();
  };
  return (
    <form
      class={s.mobileSetupCard}
      data-testid="personal-recipe-form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label>
        {t.recipeName}
        <input
          class={s.mobileSelect}
          value={name}
          maxLength={80}
          onInput={(event) => setName(event.currentTarget.value)}
        />
      </label>
      <div class={s.mobileSetupGrid}>
        {(
          [
            [t.baseServings, servings, setServings],
            [t.prepMinutes, prep, setPrep],
            [t.cookMinutes, cook, setCook],
          ] as const
        ).map(([label, value, change]) => (
          <label key={String(label)}>
            {String(label)}
            <input
              class={s.mobileSelect}
              type="number"
              min={label === t.baseServings ? 1 : 0}
              max={label === t.baseServings ? 500 : 1440}
              value={String(value)}
              onInput={(event) => (change as (v: string) => void)(event.currentTarget.value)}
            />
          </label>
        ))}
      </div>
      <PersonalIngredients lines={lines} onChange={setLines} />
      <label>
        {t.instructions}
        <textarea
          class={s.mobileSelect}
          value={instructions}
          maxLength={4000}
          onInput={(event) => setInstructions(event.currentTarget.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div class={s.mobileDualActions}>
        <button class={s.mobilePrimaryBtn} type="submit">
          {t.saveRecipe}
        </button>
        <button class={s.mobileSecondaryBtn} type="button" onClick={onClose}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

function personalRecipe(
  recipe: ExtendedFoodRecipe | undefined,
  values: string[],
  lines: RecipeLine[],
  recipes: ExtendedFoodRecipe[],
): ExtendedFoodRecipe {
  const [name, servings, prep, cook, instructions] = values;
  const id =
    recipe?.id ??
    `personal-${Array.from({ length: 11 }, (_, i) => i + 1).find(
      (i) => !recipes.some((r) => r.id === `personal-${i}`),
    )}`;
  return {
    id,
    version: recipe ? `0.1.${Number(recipe.version.split('.')[2]) + 1}` : '0.1.0',
    name: name.trim(),
    course: 'main',
    cuisine: 'Personal',
    diet: 'vegetarian',
    servings: Number(servings),
    prepMinutes: Number(prep),
    cookMinutes: Number(cook),
    ingredients: lines,
    steps: instructions.trim().split('\n'),
    verified: false,
    operational: true,
    thumbnailUrl: '/food/recipes/personal-placeholder.svg',
  };
}

function validRecipe(
  name: string,
  servings: string,
  prep: string,
  cook: string,
  instructions: string,
  lines: RecipeLine[],
) {
  const integer = (value: string, min: number, max: number) =>
    /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
  return (
    name.trim().length > 0 &&
    name.trim().length <= 80 &&
    integer(servings, 1, 500) &&
    integer(prep, 0, 1440) &&
    integer(cook, 0, 1440) &&
    instructions.trim().length > 0 &&
    instructions.trim().split('\n').length <= 30 &&
    instructions
      .trim()
      .split('\n')
      .every((step) => step.trim().length > 0 && step.length <= 400) &&
    lines.length > 0 &&
    lines.length <= 20 &&
    lines.every(
      (line) =>
        /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(line.quantity) &&
        Number(line.quantity) > 0 &&
        Number(line.quantity) <= 1_000_000 &&
        CATALOG_INGREDIENTS.some((i) => i.id === line.ingredient),
    )
  );
}

function PersonalIngredients({
  lines,
  onChange,
}: {
  lines: RecipeLine[];
  onChange: (lines: RecipeLine[]) => void;
}) {
  const update = (index: number, line: RecipeLine) =>
    onChange(lines.map((old, i) => (i === index ? line : old)));
  return (
    <fieldset>
      <legend>{t.ingredients}</legend>
      {lines.map((line, index) => (
        <div class={s.mobileSetupGrid} key={index}>
          <label>
            {t.ingredient} {index + 1}
            <select
              class={s.mobileSelect}
              aria-label={`${t.ingredient} ${index + 1}`}
              value={line.ingredient}
              onChange={(event) => {
                const ingredient = CATALOG_INGREDIENTS.find(
                  (i) => i.id === event.currentTarget.value,
                );
                if (ingredient)
                  update(index, {
                    ...line,
                    ingredient: ingredient.id,
                    unit:
                      ingredient.dimension === 'mass'
                        ? 'g'
                        : ingredient.dimension === 'volume'
                          ? 'ml'
                          : 'piece',
                  });
              }}
            >
              {CATALOG_INGREDIENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.amount} {index + 1}
            <input
              class={s.mobileSelect}
              inputMode="decimal"
              aria-label={`${t.amount} ${index + 1}`}
              value={line.quantity}
              onInput={(event) => update(index, { ...line, quantity: event.currentTarget.value })}
            />
          </label>
          <span>{line.unit}</span>
          <button
            class={s.mobileSecondaryBtn}
            type="button"
            disabled={lines.length === 1}
            aria-label={`${t.remove}: ${index + 1}`}
            onClick={() => onChange(lines.filter((_, i) => i !== index))}
          >
            {t.remove}
          </button>
        </div>
      ))}
      <button
        class={s.mobileSecondaryBtn}
        type="button"
        disabled={lines.length >= 20}
        onClick={() => onChange([...lines, initialLine()])}
      >
        {t.addIngredient}
      </button>
    </fieldset>
  );
}

function resetRecipeProgress(planner: UseFoodPlannerReturn, id: string) {
  planner.setCompletedTasks((previous) =>
    Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${id}-`))),
  );
}
function removePersonalRecipe(planner: UseFoodPlannerReturn, id: string) {
  if (planner.selectedRecipeIds.has(id)) planner.toggleRecipe(id);
  if (planner.favorites.has(id)) planner.toggleFavorite(id);
  planner.setPersonalRecipes((recipes) => recipes.filter((item) => item.id !== id));
  planner.setPortionFactors((previous) => {
    const next = { ...previous };
    delete next[id];
    return next;
  });
  resetRecipeProgress(planner, id);
}
