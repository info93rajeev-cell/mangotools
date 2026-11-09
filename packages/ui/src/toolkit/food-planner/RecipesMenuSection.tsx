import { useMemo, useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_GALLERY_RECIPES, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { PersonalRecipes } from './PersonalRecipes.tsx';
import { matchesRecipeFilter, RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import { RecipesMobileView } from './RecipesMobileView.tsx';
import { SelectedMenuPanel } from './RecipesSelectedMenuComponents.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface RecipesMenuSectionProps {
  planner: UseFoodPlannerReturn;
}

export function RecipesMenuSection({ planner }: RecipesMenuSectionProps) {
  const { searchQuery, activeCourse } = planner;

  const [personal, setPersonal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite } = planner;

  const filteredRecipes = useMemo(
    () =>
      [...CATALOG_GALLERY_RECIPES, ...planner.personalRecipes].filter((r) =>
        matchesRecipeFilter(r, searchQuery, activeCourse, favoritesOnly, favorites),
      ),
    [searchQuery, activeCourse, favoritesOnly, favorites, planner.personalRecipes],
  );

  return (
    <>
      <div class={styles.desktopOnly}>
        <button
          type="button"
          class={styles.actionBtn}
          aria-expanded={personal}
          onClick={() => setPersonal(!personal)}
        >
          {t.myRecipes}
        </button>
        {personal && <PersonalRecipes planner={planner} />}
        <RecipesDesktopGrid
          planner={planner}
          filteredRecipes={filteredRecipes}
          favoritesOnly={favoritesOnly}
          setFavoritesOnly={setFavoritesOnly}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>

      <div class={styles.mobileOnly}>
        <RecipesMobileView
          planner={planner}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          favoritesOnly={favoritesOnly}
          setFavoritesOnly={setFavoritesOnly}
          filteredRecipes={filteredRecipes}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
    </>
  );
}

interface RecipesDesktopGridProps {
  planner: UseFoodPlannerReturn;
  filteredRecipes: ExtendedFoodRecipe[];
  favoritesOnly: boolean;
  setFavoritesOnly: (f: boolean) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (s: number | ((prev: number) => number)) => void;
}

function RecipesDesktopGrid(props: RecipesDesktopGridProps) {
  const {
    planner,
    filteredRecipes,
    favoritesOnly,
    setFavoritesOnly,
    favorites,
    toggleFavorite,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = props;
  const {
    searchQuery,
    setSearchQuery,
    activeCourse,
    setActiveCourse,
    selectedRecipeIds,
    toggleRecipe,
    selectedRecipes,
    setup,
    portionFactors,
    setPortionFactor,
    clearAllRecipes,
    setActiveSection,
  } = planner;

  return (
    <div class={`${styles.layoutGrid} ${styles.recipesLayoutGrid}`}>
      <RecipeGalleryPanel
        catalogRecipes={[...CATALOG_GALLERY_RECIPES, ...planner.personalRecipes]}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCourse={activeCourse}
        setActiveCourse={setActiveCourse}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={setFavoritesOnly}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        filteredRecipes={filteredRecipes}
        selectedRecipeIds={selectedRecipeIds}
        toggleRecipe={toggleRecipe}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      <SelectedMenuPanel
        selectedRecipes={selectedRecipes}
        guests={setup.guests}
        portionFactors={portionFactors}
        setPortionFactor={setPortionFactor}
        toggleRecipe={toggleRecipe}
        clearAllRecipes={clearAllRecipes}
        onContinue={() => setActiveSection('ingredients')}
      />
    </div>
  );
}
