import { useMemo, useState } from 'preact/hooks';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import {
  CATALOG_GALLERY_RECIPES,
  type ExtendedFoodRecipe,
  isRecipeEligibleForCountry,
  isRecipeEligibleForLocation,
} from './foodReferenceData.ts';
import { PersonalRecipes } from './PersonalRecipes.tsx';
import { matchesRecipeFilter, RecipeGalleryPanel } from './RecipesGalleryComponents.tsx';
import { RecipesMobileView } from './RecipesMobileView.tsx';
import { SelectedMenuPanel } from './RecipesSelectedMenuComponents.tsx';
import type { UseFoodPlannerReturn } from './useFoodPlanner.ts';

export { isRecipeEligibleForCountry, isRecipeEligibleForLocation };

interface RecipesMenuSectionProps {
  planner: UseFoodPlannerReturn;
}

function useFilteredCatalogRecipes(planner: UseFoodPlannerReturn, favoritesOnly: boolean) {
  const { searchQuery, activeCourse, activeDiet, setup, favorites, personalRecipes } = planner;
  return useMemo(
    () =>
      [...CATALOG_GALLERY_RECIPES, ...personalRecipes].filter((r) => {
        if (
          !searchQuery &&
          !favoritesOnly &&
          !isRecipeEligibleForLocation(r, setup.location, setup.country)
        ) {
          return false;
        }
        return matchesRecipeFilter(
          r,
          searchQuery,
          activeCourse,
          favoritesOnly,
          favorites,
          activeDiet,
        );
      }),
    [
      searchQuery,
      activeCourse,
      activeDiet,
      favoritesOnly,
      favorites,
      personalRecipes,
      setup.location,
      setup.country,
    ],
  );
}

export function RecipesMenuSection({ planner }: RecipesMenuSectionProps) {
  const [personal, setPersonal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite } = planner;
  const filteredRecipes = useFilteredCatalogRecipes(planner, favoritesOnly);

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

function getEligibleCatalogRecipes(
  personal: ExtendedFoodRecipe[],
  location?: string,
  country?: string,
) {
  return [...CATALOG_GALLERY_RECIPES, ...personal].filter((r) =>
    isRecipeEligibleForLocation(r, location, country),
  );
}

function RecipesDesktopGrid(props: RecipesDesktopGridProps) {
  const { planner, filteredRecipes } = props;
  const { setup, portionFactors, toggleRecipe } = planner;

  return (
    <div class={`${styles.layoutGrid} ${styles.recipesLayoutGrid}`}>
      <RecipeGalleryPanel
        catalogRecipes={getEligibleCatalogRecipes(
          planner.personalRecipes,
          setup.location,
          setup.country,
        )}
        searchQuery={planner.searchQuery}
        setSearchQuery={planner.setSearchQuery}
        activeCourse={planner.activeCourse}
        setActiveCourse={planner.setActiveCourse}
        activeDiet={planner.activeDiet}
        setActiveDiet={planner.setActiveDiet}
        favoritesOnly={props.favoritesOnly}
        setFavoritesOnly={props.setFavoritesOnly}
        favorites={props.favorites}
        toggleFavorite={props.toggleFavorite}
        filteredRecipes={filteredRecipes}
        selectedRecipeIds={planner.selectedRecipeIds}
        toggleRecipe={toggleRecipe}
        page={props.page}
        setPage={props.setPage}
        pageSize={props.pageSize}
        setPageSize={props.setPageSize}
        guests={setup.guests}
        portionFactors={portionFactors}
      />
      <SelectedMenuPanel
        selectedRecipes={planner.selectedRecipes}
        guests={setup.guests}
        portionFactors={portionFactors}
        setPortionFactor={planner.setPortionFactor}
        toggleRecipe={toggleRecipe}
        clearAllRecipes={planner.clearAllRecipes}
        onContinue={() => planner.setActiveSection('ingredients')}
        location={setup.location}
        occasion={setup.occasion}
      />
    </div>
  );
}
