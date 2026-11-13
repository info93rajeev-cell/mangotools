import { describe, expect, it } from 'vitest';
import { CATALOG_INGREDIENTS } from './foodIngredientsData.ts';
import { CATALOG_AWAITING_RECIPES } from './foodRecipesCatalogAwaiting.ts';
import { getRecipeVerificationInfo, RECIPES } from './foodRecipesData.ts';
import {
  AISLE_DISPLAY_MAP,
  DEFAULT_SCHEDULE_TASKS,
  REFERENCE_PRICES,
  SAMPLE_PLAN,
} from './foodReferenceData.ts';
import { getCourseIcon, getCoursePlaceholderClass } from './RecipeCardImage.tsx';
import { matchesCourseFilter } from './RecipesGalleryComponents.tsx';

describe('Food Planner Toolkit Reference Data', () => {
  it('contains the 21 FP-001 catalog ingredients with valid aisles and dimensions', () => {
    expect(CATALOG_INGREDIENTS.length).toBeGreaterThanOrEqual(21);
    for (const ing of CATALOG_INGREDIENTS) {
      expect(ing.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ing.name).toBeTruthy();
      expect(['mass', 'volume', 'count']).toContain(ing.dimension);
      expect([
        'grains',
        'pulses',
        'vegetables',
        'herbs',
        'spices',
        'oils-fats',
        'dairy',
        'other',
      ]).toContain(ing.aisle);
    }
  });

  it('contains the verified and prototype recipes with steps and ingredients', () => {
    expect(RECIPES.length).toBe(18);
    const verified = RECIPES.filter((r) => r.verified);
    expect(verified.map((r) => r.id)).toEqual([
      'jeera-rice',
      'dal-tadka',
      'aloo-gobi',
      'besan-ladoo',
      'mathri',
      'shahi-paneer',
      'raita',
      'mixed-veg-salad',
      'gulab-jamun',
      'kaju-katli',
      'kheer',
      'jalebi',
      'rasgulla',
      'samosa',
      'paneer-tikka',
      'pakoda',
      'chana-masala',
      'masala-chai',
    ]);

    // Check verification status label mapping
    const jeera = RECIPES.find((r) => r.id === 'jeera-rice');
    expect(jeera).toBeDefined();
    if (jeera) {
      expect(getRecipeVerificationInfo(jeera).label).toBe('✓ Source Checked');
    }
    const ladoo = RECIPES.find((r) => r.id === 'besan-ladoo');
    expect(ladoo).toBeDefined();
    if (ladoo) {
      expect(getRecipeVerificationInfo(ladoo).label).toBe('✓ Source Checked');
    }

    for (const recipe of RECIPES) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.servings).toBeGreaterThan(0);
    }
  });

  it('contains valid reference prices in INR with observed dates', () => {
    expect(REFERENCE_PRICES.length).toBeGreaterThan(15);
    for (const p of REFERENCE_PRICES) {
      expect(p.ingredient).toBeTruthy();
      expect(Number.parseFloat(p.priceInr)).toBeGreaterThan(0);
      expect(['retail-reference', 'wholesale-reference']).toContain(p.kind);
    }
  });

  it('has a complete Diwali sample plan with verified dishes and schedule tasks', () => {
    expect(SAMPLE_PLAN.guests).toBe(20);
    expect(SAMPLE_PLAN.selectedDishes.length).toBe(6);
    expect(SAMPLE_PLAN.selectedDishes).toContain('jeera-rice');
    expect(SAMPLE_PLAN.selectedDishes).toContain('dal-tadka');
    expect(SAMPLE_PLAN.selectedDishes).toContain('aloo-gobi');

    expect(DEFAULT_SCHEDULE_TASKS.length).toBe(10);
    expect(DEFAULT_SCHEDULE_TASKS[0]?.phase).toBe('early-prep');
    expect(DEFAULT_SCHEDULE_TASKS[DEFAULT_SCHEDULE_TASKS.length - 1]?.phase).toBe('assembly');
  });

  it('maps all grocery aisles to user-friendly titles', () => {
    expect(AISLE_DISPLAY_MAP.vegetables).toBe('Vegetables (Fresh)');
    expect(AISLE_DISPLAY_MAP.grains).toBe('Grains & Rice');
    expect(AISLE_DISPLAY_MAP.pulses).toBe('Pulses & Dal');
    expect(AISLE_DISPLAY_MAP.spices).toBe('Spices & Condiments');
    expect(AISLE_DISPLAY_MAP.dairy).toBe('Dairy & Paneer');
    expect(AISLE_DISPLAY_MAP['oils-fats']).toBe('Oil & Ghee');
  });

  it('covers every recipe with thumbnail URL and image provenance', () => {
    expect(RECIPES.length).toBe(18);
    for (const recipe of RECIPES) {
      expect(recipe.thumbnailUrl).toBeDefined();
      expect(recipe.thumbnailUrl).toMatch(/^\/food\/recipes\/[a-z0-9-]+\.jpg$/);
      expect(recipe.imageProvenance).toBeDefined();
      expect(recipe.imageProvenance?.type).toBe('ai-generated');
      expect(recipe.imageProvenance?.notes).toBeTruthy();
    }
  });

  it('makes all sourced festival sweets available with valid ingredients', () => {
    const ingredientIds = new Set(CATALOG_INGREDIENTS.map((ingredient) => ingredient.id));
    for (const id of ['besan-ladoo', 'gulab-jamun', 'kaju-katli', 'kheer', 'jalebi', 'rasgulla']) {
      const recipe = RECIPES.find((item) => item.id === id);
      expect(recipe?.awaitingData).toBeFalsy();
      expect(recipe?.sources?.length).toBeGreaterThanOrEqual(2);
      expect(recipe?.ingredients.length).toBeGreaterThan(0);
      for (const line of recipe?.ingredients ?? []) {
        expect(ingredientIds.has(line.ingredient)).toBe(true);
      }
    }
  });

  it('makes all 18 illustrated recipes ready and fully operational with valid ingredients and sources', () => {
    expect(CATALOG_AWAITING_RECIPES).toHaveLength(0);
    expect(RECIPES).toHaveLength(18);
    const ingredientIds = new Set(CATALOG_INGREDIENTS.map((ingredient) => ingredient.id));
    for (const recipe of RECIPES) {
      expect(recipe.awaitingData).toBeFalsy();
      expect(recipe.sources?.length).toBeGreaterThanOrEqual(2);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.thumbnailUrl).toBe(`/food/recipes/${recipe.id}.jpg`);
      expect(recipe.imageProvenance?.type).toBe('ai-generated');
      for (const line of recipe.ingredients) {
        expect(ingredientIds.has(line.ingredient)).toBe(true);
      }
    }
  });

  it('provides course icons and fallback placeholder classes for all categories', () => {
    expect(getCourseIcon('rice')).toBe('🍚');
    expect(getCourseIcon('dal')).toBe('🍲');
    expect(getCourseIcon('main')).toBe('🍛');
    expect(getCourseIcon('side')).toBe('🥗');
    expect(getCourseIcon('snack')).toBe('🥟');
    expect(getCourseIcon('dessert')).toBe('🍨');
    expect(getCourseIcon('bread')).toBe('🫓');
    expect(getCourseIcon('drink')).toBe('🥤');
    expect(getCourseIcon('unknown')).toBe('🍽️');

    expect(getCoursePlaceholderClass('rice')).toBeTruthy();
    expect(getCoursePlaceholderClass('dal')).toBeTruthy();
    expect(getCoursePlaceholderClass('main')).toBeTruthy();
    expect(getCoursePlaceholderClass('side')).toBeTruthy();
    expect(getCoursePlaceholderClass('snack')).toBeTruthy();
    expect(getCoursePlaceholderClass('dessert')).toBeTruthy();
    expect(getCoursePlaceholderClass('unknown')).toBeTruthy();
  });
});

it('keeps side dishes out of the beverages filter', () => {
  expect(matchesCourseFilter('drink', 'beverages')).toBe(true);
  expect(matchesCourseFilter('side', 'beverages')).toBe(false);
});
