import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import { CourseFilterBar, matchesCourseFilter } from './CourseFilterBar.tsx';
import { DietaryFilterBar } from './DietaryFilterBar.tsx';
import { type DietaryOption, matchesDietaryFilter } from './dietaryFilter.ts';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_GALLERY_RECIPES, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { RecipeDetailDialog } from './RecipeDetailDialog.tsx';
import { RecipeGalleryCard } from './RecipeGalleryCard.tsx';

export type { DietaryOption };
export { CourseFilterBar, matchesCourseFilter, matchesDietaryFilter };

export function matchesRecipeFilter(
  r: ExtendedFoodRecipe,
  searchQuery: string,
  activeCourse: string,
  favoritesOnly: boolean,
  favorites: Set<string>,
  activeDiet: DietaryOption = 'all',
): boolean {
  if (favoritesOnly && !favorites.has(r.id)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    const inName = r.name.toLowerCase().includes(q);
    const inLocal = Boolean(r.localName?.toLowerCase().includes(q));
    const inCuisine = Boolean(r.cuisine?.toLowerCase().includes(q));
    const inEvents = Boolean(r.events?.some((e) => e.toLowerCase().includes(q)));
    const inId = r.id.toLowerCase().includes(q);
    if (!inName && !inLocal && !inCuisine && !inEvents && !inId) return false;
  }
  if (!matchesDietaryFilter(r.diet, activeDiet)) return false;
  return matchesCourseFilter(r.course, activeCourse);
}

export interface RecipeGalleryPanelProps {
  catalogRecipes?: ExtendedFoodRecipe[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCourse: string;
  setActiveCourse: (c: string) => void;
  activeDiet?: DietaryOption;
  setActiveDiet?: (d: DietaryOption) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (f: boolean) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  filteredRecipes: ExtendedFoodRecipe[];
  selectedRecipeIds: Set<string>;
  toggleRecipe: (id: string) => void;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  guests: number;
  portionFactors: Record<string, number>;
}

function GallerySearchBar({
  searchQuery,
  onSearch,
}: {
  searchQuery: string;
  onSearch: (q: string) => void;
}) {
  return (
    <div class={styles.gallerySearchRow}>
      <span class={styles.gallerySearchIcon}>
        <Icon name="search" />
      </span>
      <input
        type="text"
        class={styles.gallerySearchInput}
        aria-label="Search recipes"
        placeholder="Search recipes (e.g., Ladoo, Mathri, Paneer, Biryani...)"
        value={searchQuery}
        onInput={(e) => onSearch((e.target as HTMLInputElement).value)}
      />
    </div>
  );
}

function GalleryHeader({
  filteredCount,
  readyCount,
  awaitingCount,
}: {
  filteredCount: number;
  readyCount: number;
  awaitingCount: number;
}) {
  return (
    <header class={styles.cardHeader}>
      <div>
        <h2 class={styles.cardTitle}>
          <Icon name="book-open" />
          {t.gallery} ({filteredCount})
        </h2>
        <p class={styles.cardSubtitle}>{t.galleryIntro}</p>
        <p class={styles.recipeAvailability}>
          {readyCount} {t.readyRecipes}
          {awaitingCount > 0 ? ` · ${awaitingCount} ${t.awaitingTrials}` : ''}
        </p>
      </div>
    </header>
  );
}

function GalleryFilters(props: {
  catalogRecipes: ExtendedFoodRecipe[];
  activeCourse: string;
  setActiveCourse: (c: string) => void;
  activeDiet?: DietaryOption;
  setActiveDiet?: (d: DietaryOption) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (f: boolean) => void;
  favoritesCount: number;
  setPage: (p: number) => void;
}) {
  const {
    catalogRecipes,
    activeCourse,
    setActiveCourse,
    activeDiet,
    setActiveDiet,
    favoritesOnly,
    setFavoritesOnly,
    favoritesCount,
    setPage,
  } = props;
  return (
    <>
      {activeDiet && setActiveDiet && (
        <DietaryFilterBar
          catalogRecipes={catalogRecipes}
          activeDiet={activeDiet}
          onSelectDiet={(d) => {
            setActiveDiet(d);
            setPage(1);
          }}
        />
      )}
      <CourseFilterBar
        catalogRecipes={catalogRecipes}
        activeCourse={activeCourse}
        favoritesOnly={favoritesOnly}
        favoritesCount={favoritesCount}
        onSelect={(c) => {
          setFavoritesOnly(false);
          setActiveCourse(c);
          setPage(1);
        }}
        onSelectFavorites={() => {
          setFavoritesOnly(true);
          setPage(1);
        }}
      />
    </>
  );
}

function RecipeCardGrid({
  recipes,
  selectedIds,
  favorites,
  onToggleFavorite,
  onToggleRecipe,
  onViewDetail,
}: {
  recipes: ExtendedFoodRecipe[];
  selectedIds: Set<string>;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleRecipe: (id: string) => void;
  onViewDetail: (r: ExtendedFoodRecipe) => void;
}) {
  return (
    <div class={styles.recipeGrid4}>
      {recipes.map((recipe) => (
        <RecipeGalleryCard
          key={recipe.id}
          recipe={recipe}
          isAdded={selectedIds.has(recipe.id)}
          isFavorited={favorites.has(recipe.id)}
          onToggleFavorite={() => onToggleFavorite(recipe.id)}
          onToggle={() => {
            if (recipe.awaitingData) return;
            onToggleRecipe(recipe.id);
          }}
          onView={() => onViewDetail(recipe)}
        />
      ))}
    </div>
  );
}

function useGalleryPagination(filteredCount: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(filteredCount, currentPage * pageSize);
  return { totalPages, currentPage, startIdx, endIdx };
}

export function RecipeGalleryPanel(props: RecipeGalleryPanelProps) {
  const { catalogRecipes = CATALOG_GALLERY_RECIPES, filteredRecipes, page, pageSize } = props;
  const [detailRecipe, setDetailRecipe] = useState<ExtendedFoodRecipe | null>(null);
  const readyCount = catalogRecipes.filter((r) => !r.awaitingData).length;
  const awaitingCount = catalogRecipes.length - readyCount;
  const { totalPages, currentPage, startIdx, endIdx } = useGalleryPagination(
    filteredRecipes.length,
    page,
    pageSize,
  );
  const pagedRecipes = filteredRecipes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div class={styles.card}>
      <GalleryHeader
        filteredCount={filteredRecipes.length}
        readyCount={readyCount}
        awaitingCount={awaitingCount}
      />
      <GallerySearchBar
        searchQuery={props.searchQuery}
        onSearch={(q) => {
          props.setSearchQuery(q);
          props.setPage(1);
        }}
      />
      <GalleryFilters
        catalogRecipes={catalogRecipes}
        activeCourse={props.activeCourse}
        setActiveCourse={props.setActiveCourse}
        activeDiet={props.activeDiet}
        setActiveDiet={props.setActiveDiet}
        favoritesOnly={props.favoritesOnly}
        setFavoritesOnly={props.setFavoritesOnly}
        favoritesCount={props.favorites.size}
        setPage={props.setPage}
      />
      <RecipeCardGrid
        recipes={pagedRecipes}
        selectedIds={props.selectedRecipeIds}
        favorites={props.favorites}
        onToggleFavorite={props.toggleFavorite}
        onToggleRecipe={props.toggleRecipe}
        onViewDetail={setDetailRecipe}
      />
      <RecipeDetailDialog
        recipe={detailRecipe}
        servings={props.guests * (props.portionFactors[detailRecipe?.id ?? ''] ?? 1)}
        onClose={() => setDetailRecipe(null)}
      />
      <GalleryPaginationBar
        totalItems={filteredRecipes.length}
        startIdx={startIdx}
        endIdx={endIdx}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={props.setPage}
        onPageSizeChange={(sz) => {
          props.setPageSize(sz);
          props.setPage(1);
        }}
      />
    </div>
  );
}

function GalleryPaginationBar({
  totalItems,
  startIdx,
  endIdx,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  totalItems: number;
  startIdx: number;
  endIdx: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (p: number | ((prev: number) => number)) => void;
  onPageSizeChange: (sz: number) => void;
}) {
  return (
    <div class={styles.paginationBar}>
      <span>
        Showing {totalItems === 0 ? '0' : `${startIdx}-${endIdx}`} of {totalItems} recipes
      </span>
      <div class={styles.pageNumbers}>
        <button
          type="button"
          class={styles.pageBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          aria-label="Previous Page"
        >
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
          <button
            key={pNum}
            type="button"
            class={`${styles.pageBtn} ${currentPage === pNum ? styles.pageBtnActive : ''}`}
            onClick={() => onPageChange(pNum)}
          >
            {pNum}
          </button>
        ))}
        <button
          type="button"
          class={styles.pageBtn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          aria-label="Next Page"
        >
          &gt;
        </button>
      </div>
      <select
        class={styles.pageSizeSelect}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number((e.target as HTMLSelectElement).value) || 8)}
        aria-label="Recipes per page"
      >
        <option value="8">8 per page</option>
        <option value="16">16 per page</option>
      </select>
    </div>
  );
}
