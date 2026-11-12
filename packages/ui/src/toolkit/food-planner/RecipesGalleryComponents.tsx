import { useState } from 'preact/hooks';
import { Icon } from '../../primitives/Icon.tsx';
import styles from './foodPlanner.module.css';
import { foodPlannerStrings as t } from './foodPlannerStrings.ts';
import { CATALOG_GALLERY_RECIPES, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { RecipeDetailDialog } from './RecipeDetailDialog.tsx';
import { RecipeGalleryCard } from './RecipeGalleryCard.tsx';

export function matchesCourseFilter(recipeCourse: string, activeCourse: string): boolean {
  if (activeCourse === 'all') return true;
  if (activeCourse === 'sweets') return recipeCourse === 'dessert';
  if (activeCourse === 'snacks') return recipeCourse === 'snack';
  if (activeCourse === 'main') {
    return recipeCourse === 'main' || recipeCourse === 'dal' || recipeCourse === 'rice';
  }
  if (activeCourse === 'beverages') {
    return recipeCourse === 'drink';
  }
  return recipeCourse === activeCourse;
}

export function matchesRecipeFilter(
  r: ExtendedFoodRecipe,
  searchQuery: string,
  activeCourse: string,
  favoritesOnly: boolean,
  favorites: Set<string>,
): boolean {
  if (favoritesOnly && !favorites.has(r.id)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const inName = r.name.toLowerCase().includes(q);
    const inLocal = Boolean(r.localName?.includes(searchQuery));
    if (!inName && !inLocal) return false;
  }
  return matchesCourseFilter(r.course, activeCourse);
}

export interface RecipeGalleryPanelProps {
  catalogRecipes?: ExtendedFoodRecipe[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCourse: string;
  setActiveCourse: (c: string) => void;
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

export function RecipeGalleryPanel({
  catalogRecipes = CATALOG_GALLERY_RECIPES,
  searchQuery,
  setSearchQuery,
  activeCourse,
  setActiveCourse,
  favoritesOnly,
  setFavoritesOnly,
  favorites,
  toggleFavorite,
  filteredRecipes,
  selectedRecipeIds,
  toggleRecipe,
  page,
  setPage,
  pageSize,
  setPageSize,
  guests,
  portionFactors,
}: RecipeGalleryPanelProps) {
  const [detailRecipe, setDetailRecipe] = useState<ExtendedFoodRecipe | null>(null);
  const readyCount = catalogRecipes.filter((recipe) => !recipe.awaitingData).length;
  const awaitingCount = catalogRecipes.length - readyCount;
  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRecipes = filteredRecipes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(filteredRecipes.length, currentPage * pageSize);

  return (
    <div class={styles.card}>
      <header class={styles.cardHeader}>
        <div>
          <h2 class={styles.cardTitle}>
            <Icon name="book-open" />
            {t.gallery} ({filteredRecipes.length})
          </h2>
          <p class={styles.cardSubtitle}>{t.galleryIntro}</p>
          <p class={styles.recipeAvailability}>
            {readyCount} {t.readyRecipes}
            {awaitingCount > 0 ? ` · ${awaitingCount} ${t.awaitingTrials}` : ''}
          </p>
        </div>
      </header>
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
          onInput={(e) => {
            setSearchQuery((e.target as HTMLInputElement).value);
            setPage(1);
          }}
        />
      </div>

      <CourseFilterBar
        catalogRecipes={catalogRecipes}
        activeCourse={activeCourse}
        favoritesOnly={favoritesOnly}
        favoritesCount={favorites.size}
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

      <div class={styles.recipeGrid4}>
        {pagedRecipes.map((recipe) => (
          <RecipeGalleryCard
            key={recipe.id}
            recipe={recipe}
            isAdded={selectedRecipeIds.has(recipe.id)}
            isFavorited={favorites.has(recipe.id)}
            onToggleFavorite={() => toggleFavorite(recipe.id)}
            onToggle={() => {
              if (recipe.awaitingData) return;
              toggleRecipe(recipe.id);
            }}
            onView={() => setDetailRecipe(recipe)}
          />
        ))}
      </div>

      <RecipeDetailDialog
        recipe={detailRecipe}
        servings={guests * (portionFactors[detailRecipe?.id ?? ''] ?? 1)}
        onClose={() => setDetailRecipe(null)}
      />

      <GalleryPaginationBar
        totalItems={filteredRecipes.length}
        startIdx={startIdx}
        endIdx={endIdx}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
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

function CourseFilterBar({
  catalogRecipes,
  activeCourse,
  favoritesOnly,
  favoritesCount,
  onSelect,
  onSelectFavorites,
}: {
  catalogRecipes: ExtendedFoodRecipe[];
  activeCourse: string;
  favoritesOnly: boolean;
  favoritesCount: number;
  onSelect: (c: string) => void;
  onSelectFavorites: () => void;
}) {
  const count = (course: string) =>
    catalogRecipes.filter((recipe) => matchesCourseFilter(recipe.course, course)).length;
  return (
    <div class={styles.cardHeader} style={{ marginBottom: '14px', alignItems: 'center' }}>
      <div class={styles.filterBar} style={{ margin: 0 }}>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'all' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('all')}
        >
          {t.all} ({catalogRecipes.length})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'sweets' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('sweets')}
        >
          🧁 {t.sweets} ({count('sweets')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'snacks' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('snacks')}
        >
          🥟 {t.snacks} ({count('snacks')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'main' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('main')}
        >
          🍲 {t.mainCourse} ({count('main')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${!favoritesOnly && activeCourse === 'beverages' ? styles.filterPillActive : ''}`}
          onClick={() => onSelect('beverages')}
        >
          ☕ {t.beverages} ({count('beverages')})
        </button>
        <button
          type="button"
          class={`${styles.filterPill} ${favoritesOnly ? styles.filterPillActive : ''}`}
          onClick={onSelectFavorites}
        >
          ❤️ Favorites ({favoritesCount})
        </button>
      </div>
      <div>
        <select
          class={styles.selectInput}
          style={{ height: '32px', fontSize: '12px', padding: '0 8px' }}
          value={activeCourse}
          onChange={(e) => onSelect((e.target as HTMLSelectElement).value)}
          aria-label="Browse by Course"
        >
          <option value="all">Browse by Course ∨</option>
          <option value="dessert">Desserts &amp; Sweets</option>
          <option value="snack">Snacks &amp; Savouries</option>
          <option value="main">Main Curries</option>
          <option value="rice">Rice &amp; Grains</option>
          <option value="dal">Dal &amp; Lentils</option>
          <option value="side">Sides &amp; Salads</option>
          <option value="drink">Beverages</option>
        </select>
      </div>
    </div>
  );
}
