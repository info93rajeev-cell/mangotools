import { useMemo } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import {
  type ExtendedFoodRecipe,
  getRecipeVerificationInfo,
  RECIPES,
} from './foodReferenceData.ts';
import { RecipeCardImage } from './RecipeCardImage.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface RecipesMenuSectionProps {
  planner: UseFoodPlannerReturn;
}

export function RecipesMenuSection({ planner }: RecipesMenuSectionProps) {
  const {
    selectedRecipes,
    selectedRecipeIds,
    toggleRecipe,
    portionFactors,
    setPortionFactor,
    setup,
    searchQuery,
    setSearchQuery,
    activeCourse,
    setActiveCourse,
    clearAllRecipes,
    setActiveSection,
  } = planner;

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter((r) => {
      const matchQuery =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.localName?.includes(searchQuery);
      const matchCourse =
        activeCourse === 'all' ||
        (activeCourse === 'main' &&
          (r.course === 'main' || r.course === 'dal' || r.course === 'rice')) ||
        r.course === activeCourse;
      return matchQuery && matchCourse;
    });
  }, [searchQuery, activeCourse]);

  return (
    <div class={styles.layoutGrid}>
      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <div class={styles.cardTitleGroup}>
            <h2 class={styles.cardTitle}>
              <Icon name="book-open" /> Recipe Gallery ({filteredRecipes.length} recipes)
            </h2>
            <p class={styles.cardSubtitle}>Browse, search and add recipes to your catering plan.</p>
          </div>
          <input
            type="text"
            class={styles.textInput}
            style={{ maxWidth: '240px' }}
            aria-label="Search recipes"
            placeholder="Search recipes (e.g., Dal, Rice...)"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          />
        </div>

        <CourseFilterBar activeCourse={activeCourse} onSelect={setActiveCourse} />

        <div class={styles.recipeGrid}>
          {filteredRecipes.map((recipe) => (
            <RecipeGalleryCard
              key={recipe.id}
              recipe={recipe}
              isAdded={selectedRecipeIds.has(recipe.id)}
              onToggle={() => toggleRecipe(recipe.id)}
            />
          ))}
        </div>
      </div>

      <div class={styles.card}>
        <div class={styles.cardHeader}>
          <div class={styles.cardTitleGroup}>
            <h2 class={styles.cardTitle}>
              <Icon name="utensils" /> My Menu ({selectedRecipes.length} recipes)
            </h2>
            <p class={styles.cardSubtitle}>Selected dishes for {setup.guests} guests.</p>
          </div>
          {selectedRecipes.length > 0 && (
            <button type="button" class={styles.actionBtn} onClick={clearAllRecipes}>
              <Icon name="trash-2" /> Clear All
            </button>
          )}
        </div>

        <SelectedMenuTable
          recipes={selectedRecipes}
          guests={setup.guests}
          portionFactors={portionFactors}
          onSetPortion={setPortionFactor}
          onRemove={toggleRecipe}
        />

        <PlanSummaryBanner selectedRecipes={selectedRecipes} guests={setup.guests} />

        <button
          type="button"
          class={styles.ctaBtn}
          disabled={selectedRecipes.length === 0}
          onClick={() => setActiveSection('ingredients')}
        >
          Continue to Ingredients <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  );
}

function CourseFilterBar({
  activeCourse,
  onSelect,
}: {
  activeCourse: string;
  onSelect: (c: string) => void;
}) {
  return (
    <div class={styles.filterBar}>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCourse === 'all' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('all')}
      >
        All ({RECIPES.length})
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCourse === 'main' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('main')}
      >
        Main Dishes
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCourse === 'snack' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('snack')}
      >
        Snacks
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCourse === 'dessert' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('dessert')}
      >
        Desserts
      </button>
      <button
        type="button"
        class={`${styles.filterPill} ${activeCourse === 'side' ? styles.filterPillActive : ''}`}
        onClick={() => onSelect('side')}
      >
        Sides & Salads
      </button>
    </div>
  );
}

function SelectedMenuTable({
  recipes,
  guests,
  portionFactors,
  onSetPortion,
  onRemove,
}: {
  recipes: ExtendedFoodRecipe[];
  guests: number;
  portionFactors: Record<string, number>;
  onSetPortion: (id: string, factor: number) => void;
  onRemove: (id: string) => void;
}) {
  if (recipes.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No recipes selected yet. Pick recipes from the gallery on the left.
      </p>
    );
  }

  return (
    <div class={styles.tableWrapper}>
      <table class={styles.table} aria-label="Selected Dishes Table">
        <thead>
          <tr>
            <th>#</th>
            <th>Recipe</th>
            <th>Servings</th>
            <th>Portion</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe, idx) => (
            <tr key={recipe.id}>
              <td>{idx + 1}</td>
              <td>
                <strong>{recipe.name}</strong>
                <span
                  class={`${styles.badge} ${styles[getRecipeVerificationInfo(recipe).badgeClass]}`}
                  style={{ marginLeft: '6px' }}
                  title={getRecipeVerificationInfo(recipe).title}
                >
                  {getRecipeVerificationInfo(recipe).label}
                </span>
              </td>
              <td>{guests}</td>
              <td>
                <div class={styles.stepper}>
                  <button
                    type="button"
                    class={styles.stepperBtn}
                    aria-label={`Decrease portion for ${recipe.name}`}
                    onClick={() => onSetPortion(recipe.id, (portionFactors[recipe.id] ?? 1) - 0.25)}
                  >
                    -
                  </button>
                  <span class={styles.stepperVal}>{portionFactors[recipe.id] ?? 1}x</span>
                  <button
                    type="button"
                    class={styles.stepperBtn}
                    aria-label={`Increase portion for ${recipe.name}`}
                    onClick={() => onSetPortion(recipe.id, (portionFactors[recipe.id] ?? 1) + 0.25)}
                  >
                    +
                  </button>
                </div>
              </td>
              <td>
                <button
                  type="button"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#ef4444',
                  }}
                  title="Remove dish"
                  aria-label={`Remove ${recipe.name} from menu`}
                  onClick={() => onRemove(recipe.id)}
                >
                  <Icon name="trash-2" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanSummaryBanner({
  selectedRecipes,
  guests,
}: {
  selectedRecipes: ExtendedFoodRecipe[];
  guests: number;
}) {
  const totalMinutes = selectedRecipes.reduce((sum, r) => sum + r.prepMinutes + r.cookMinutes, 0);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const prepTimeStr = hrs === 0 ? `${mins} min` : `${hrs} hr ${mins} min`;
  const weightStr = (selectedRecipes.length * (guests * 0.15)).toFixed(2);

  return (
    <div class={styles.summaryBanner}>
      <div class={styles.summaryStats}>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="users" /> People
          </span>
          <span class={styles.statValue}>{guests}</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="utensils" /> Recipes
          </span>
          <span class={styles.statValue}>{selectedRecipes.length}</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="scale" /> Total Qty
          </span>
          <span class={styles.statValue}>~{weightStr} kg</span>
        </div>
        <div class={styles.statItem}>
          <span class={styles.statLabel}>
            <Icon name="clock" /> Est. Prep Time
          </span>
          <span class={styles.statValue}>{prepTimeStr}</span>
        </div>
      </div>
    </div>
  );
}

function RecipeGalleryCard({
  recipe,
  isAdded,
  onToggle,
}: {
  recipe: ExtendedFoodRecipe;
  isAdded: boolean;
  onToggle: () => void;
}) {
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.name} recipe`)}`;

  return (
    <div class={styles.recipeCard}>
      <RecipeCardImage recipe={recipe} />
      <div class={styles.recipeMeta}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
          }}
        >
          <h3 class={styles.recipeName}>{recipe.name}</h3>
          <span
            class={`${styles.badge} ${styles[getRecipeVerificationInfo(recipe).badgeClass]}`}
            style={{ fontSize: '10px', padding: '1px 6px' }}
            title={getRecipeVerificationInfo(recipe).title}
          >
            {getRecipeVerificationInfo(recipe).label}
          </span>
        </div>
        <div class={styles.recipeInfoRow}>
          <span>
            <Icon name="clock" /> {recipe.prepMinutes + recipe.cookMinutes}m
          </span>
          <span>•</span>
          <span style={{ textTransform: 'capitalize' }}>{recipe.course}</span>
        </div>
      </div>
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
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '11px',
          color: '#64748b',
          textDecoration: 'none',
          textAlign: 'center',
          marginTop: '2px',
        }}
        title="External recipe videos (unverified)"
      >
        Video Ideas ↗
      </a>
    </div>
  );
}
