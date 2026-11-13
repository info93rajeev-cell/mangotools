import { describe, expect, it } from 'vitest';
import { unitOf } from '../../engines/food/src/units.ts';
import {
  CULINARY_REGIONS,
  getCulinaryRegionId,
  isRecipeEligibleForLocation,
} from '../../packages/ui/src/toolkit/food-planner/foodCulinaryRegions.ts';
import {
  CATALOG_INGREDIENTS,
  EUROPE_RECIPES,
  GLOBAL_RECIPES,
  LATIN_AMERICA_RECIPES,
  MIDDLE_EAST_RECIPES,
  PAN_ASIAN_RECIPES,
  RECIPES,
  SOUTH_ASIA_RECIPES,
  US_RECIPES,
} from '../../packages/ui/src/toolkit/food-planner/foodReferenceData.ts';
import { recommendMenu } from '../../packages/ui/src/toolkit/food-planner/plannerMenuRecommendation.ts';

function checkSingleIngredient(
  recipeId: string,
  ing: { ingredient: string; unit: string },
  catalogMap: Map<string, { dimension: string }>,
): string | null {
  const found = catalogMap.get(ing.ingredient);
  if (!found) return `${recipeId}: unknown ingredient ${ing.ingredient}`;
  const unitDef = unitOf(ing.unit);
  if (!unitDef) return `${recipeId}: unknown unit ${ing.unit} for ${ing.ingredient}`;
  if (unitDef.dimension !== found.dimension) {
    return `${recipeId}: dimension mismatch for ${ing.ingredient} (${ing.unit} is ${unitDef.dimension}, expected ${found.dimension})`;
  }
  return null;
}

function validateRecipeIngredients(recipes: typeof GLOBAL_RECIPES) {
  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));
  const errors: string[] = [];

  for (const recipe of recipes) {
    expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
    expect(recipe.sources?.length).toBeGreaterThanOrEqual(2);
    expect(recipe.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(recipe.verification?.status).toBe('source-checked');

    for (const ing of recipe.ingredients) {
      const err = checkSingleIngredient(recipe.id, ing, catalogMap);
      if (err) errors.push(err);
    }
  }
  return errors;
}

describe('Global Food Planner — 6 Culinary Continents System', () => {
  it('defines the 6 approved culinary continents with complete metadata', () => {
    expect(CULINARY_REGIONS.length).toBe(6);
    const ids = CULINARY_REGIONS.map((r) => r.id);
    expect(ids).toEqual([
      'india-south-asia',
      'north-america',
      'europe-med',
      'east-pan-asian',
      'middle-east',
      'latin-america',
    ]);

    for (const region of CULINARY_REGIONS) {
      expect(region.name).toBeTruthy();
      expect(region.currency).toMatch(/INR|USD/);
      expect(region.currencySymbol).toMatch(/₹|\$/);
      expect(region.unitSystem).toMatch(/metric|us-customary/);
      expect(Number(region.defaultBudget)).toBeGreaterThan(0);
    }
  });

  it('correctly maps region names and legacy city strings to region IDs', () => {
    expect(getCulinaryRegionId('India & South Asia')).toBe('india-south-asia');
    expect(getCulinaryRegionId('Delhi, India')).toBe('india-south-asia');
    expect(getCulinaryRegionId('North America')).toBe('north-america');
    expect(getCulinaryRegionId('New York, United States')).toBe('north-america');
    expect(getCulinaryRegionId('Europe & Mediterranean')).toBe('europe-med');
    expect(getCulinaryRegionId('East & Pan-Asian')).toBe('east-pan-asian');
    expect(getCulinaryRegionId('Middle East & Levantine')).toBe('middle-east');
    expect(getCulinaryRegionId('Latin America & Mexican')).toBe('latin-america');
  });

  it('has valid ingredients and matching dimensions for all South Asian recipes', () => {
    const errors = validateRecipeIngredients(SOUTH_ASIA_RECIPES);
    expect(errors).toEqual([]);
    expect(SOUTH_ASIA_RECIPES.length).toBe(4);
  });

  it('has valid ingredients and matching dimensions for all European recipes', () => {
    const errors = validateRecipeIngredients(EUROPE_RECIPES);
    expect(errors).toEqual([]);
    expect(EUROPE_RECIPES.length).toBe(6);
  });

  it('has valid ingredients and matching dimensions for all Pan-Asian recipes', () => {
    const errors = validateRecipeIngredients(PAN_ASIAN_RECIPES);
    expect(errors).toEqual([]);
    expect(PAN_ASIAN_RECIPES.length).toBe(7);
  });

  it('has valid ingredients and matching dimensions for all Middle Eastern recipes', () => {
    const errors = validateRecipeIngredients(MIDDLE_EAST_RECIPES);
    expect(errors).toEqual([]);
    expect(MIDDLE_EAST_RECIPES.length).toBe(6);
  });

  it('has valid ingredients and matching dimensions for all Latin American recipes', () => {
    const errors = validateRecipeIngredients(LATIN_AMERICA_RECIPES);
    expect(errors).toEqual([]);
    expect(LATIN_AMERICA_RECIPES.length).toBe(6);
  });

  it('filters catalog recipes correctly by culinary continent', () => {
    const all = GLOBAL_RECIPES;

    const inEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'India & South Asia'));
    expect(inEligible.length).toBe(RECIPES.length + SOUTH_ASIA_RECIPES.length);
    expect(inEligible.some((r) => r.id === 'idli-sambar')).toBe(true);
    expect(inEligible.some((r) => r.id === 'hyderabadi-biryani')).toBe(true);

    const usEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'North America'));
    expect(usEligible.length).toBe(US_RECIPES.length);
    expect(usEligible.some((r) => r.id === 'mac-and-cheese')).toBe(true);

    const euEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'Europe & Mediterranean'));
    expect(euEligible.length).toBe(EUROPE_RECIPES.length);
    expect(euEligible.some((r) => r.id === 'margherita-pizza')).toBe(true);

    const asiaEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'East & Pan-Asian'));
    expect(asiaEligible.length).toBe(PAN_ASIAN_RECIPES.length);
    expect(asiaEligible.some((r) => r.id === 'veg-fried-rice')).toBe(true);

    const meEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'Middle East & Levantine'));
    expect(meEligible.length).toBe(MIDDLE_EAST_RECIPES.length);
    expect(meEligible.some((r) => r.id === 'falafel-platter')).toBe(true);

    const laEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'Latin America & Mexican'));
    expect(laEligible.length).toBe(LATIN_AMERICA_RECIPES.length);
    expect(laEligible.some((r) => r.id === 'street-tacos')).toBe(true);
  });

  it('recommends authentic regional banquet menus for each continent', () => {
    for (const region of CULINARY_REGIONS) {
      const menu = recommendMenu({
        location: region.name,
        country: region.countryCode,
        occasion: 'Dinner',
        mealType: 'Dinner',
        availableRecipes: GLOBAL_RECIPES,
      });
      expect(menu.length).toBeGreaterThanOrEqual(4);
      for (const recipe of menu) {
        expect(isRecipeEligibleForLocation(recipe, region.name, region.countryCode)).toBe(true);
      }
    }
  });
});
