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

export function isRecipeEligibleForCountry(r: ExtendedFoodRecipe, isUS: boolean): boolean {
  if (isUS) {
    return Boolean(r.countries?.includes('US'));
  }
  return !r.countries || r.countries.includes('IN');
}

export function RecipesMenuSection({ planner }: RecipesMenuSectionProps) {
  const { searchQuery, activeCourse } = planner;

  const [personal, setPersonal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite } = planner;

  const isUS =
    planner.setup.country === 'US' ||
    planner.setup.location?.includes('United States') ||
    planner.setup.location?.includes('New York') ||
    planner.setup.location?.includes('Los Angeles');

  const filteredRecipes = useMemo(
    () =>
      [...CATALOG_GALLERY_RECIPES, ...planner.personalRecipes].filter((r) => {
        if (!searchQuery && !favoritesOnly && !isRecipeEligibleForCountry(r, isUS)) {
          return false;
        }
        return matchesRecipeFilter(r, searchQuery, activeCourse, favoritesOnly, favorites);
      }),
    [searchQuery, activeCourse, favoritesOnly, favorites, planner.personalRecipes, isUS],
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
          isUS={isUS}
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
  isUS: boolean;
}

function getEligibleCatalogRecipes(personal: ExtendedFoodRecipe[], isUS: boolean) {
  return [...CATALOG_GALLERY_RECIPES, ...personal].filter((r) =>
    isRecipeEligibleForCountry(r, isUS),
  );
}

function RecipesDesktopGrid(props: RecipesDesktopGridProps) {
  const { planner, filteredRecipes, isUS } = props;
  const { setup, portionFactors, toggleRecipe } = planner;

  return (
    <div class={`${styles.layoutGrid} ${styles.recipesLayoutGrid}`}>
      <RecipeGalleryPanel
        catalogRecipes={getEligibleCatalogRecipes(planner.personalRecipes, isUS)}
        searchQuery={planner.searchQuery}
        setSearchQuery={planner.setSearchQuery}
        activeCourse={planner.activeCourse}
        setActiveCourse={planner.setActiveCourse}
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
      />
    </div>
  );
}
