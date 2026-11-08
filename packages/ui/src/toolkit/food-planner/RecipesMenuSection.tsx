import { useMemo, useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import { CATALOG_GALLERY_RECIPES } from './foodReferenceData.ts';
import { matchesRecipeFilter, RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import { SelectedMenuPanel } from './RecipesSelectedMenuComponents.tsx';
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
