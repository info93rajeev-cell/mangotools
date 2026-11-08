import { useMemo, useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import { CATALOG_GALLERY_RECIPES, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { matchesRecipeFilter, RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import { RecipesMobileView } from './RecipesMobileView.tsx';
import { SelectedMenuPanel } from './RecipesSelectedMenuComponents.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

interface RecipesMenuSectionProps {
  planner: UseFoodPlannerReturn;
}

export function RecipesMenuSection({ planner }: RecipesMenuSectionProps) {
  const { searchQuery, activeCourse } = planner;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(['besan-ladoo', 'shahi-paneer']),
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredRecipes = useMemo(
    () =>
      CATALOG_GALLERY_RECIPES.filter((r) =>
        matchesRecipeFilter(r, searchQuery, activeCourse, favoritesOnly, favorites),
      ),
    [searchQuery, activeCourse, favoritesOnly, favorites],
  );

  return (
    <>
      <div class={styles.desktopOnly}>
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
    <div class={styles.layoutGrid}>
      <RecipeGalleryPanel
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
