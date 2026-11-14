import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { unitOf } from '../../engines/food/src/units.ts';
import { matchesDietaryFilter } from '../../packages/ui/src/toolkit/food-planner/dietaryFilter.ts';
import {
  CULINARY_REGIONS,
  getCulinaryRegionId,
  getOccasionsForRegion,
  isRecipeEligibleForLocation,
} from '../../packages/ui/src/toolkit/food-planner/foodCulinaryRegions.ts';
import {
  CATALOG_INGREDIENTS,
  EUROPE_RECIPES,
  GLOBAL_RECIPES,
  INDIAN_NON_VEG_RECIPES,
  INDIAN_VEG_PARTY_RECIPES,
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
    expect(EUROPE_RECIPES.length).toBe(15);
  });

  it('has valid ingredients and matching dimensions for all Pan-Asian recipes', () => {
    const errors = validateRecipeIngredients(PAN_ASIAN_RECIPES);
    expect(errors).toEqual([]);
    expect(PAN_ASIAN_RECIPES.length).toBe(15);
  });

  it('has valid ingredients and matching dimensions for all Middle Eastern recipes', () => {
    const errors = validateRecipeIngredients(MIDDLE_EAST_RECIPES);
    expect(errors).toEqual([]);
    expect(MIDDLE_EAST_RECIPES.length).toBe(15);
  });

  it('has valid ingredients and matching dimensions for all Latin American recipes', () => {
    const errors = validateRecipeIngredients(LATIN_AMERICA_RECIPES);
    expect(errors).toEqual([]);
    expect(LATIN_AMERICA_RECIPES.length).toBe(14);
  });

  it('has valid ingredients and matching dimensions for all Indian Non-Veg recipes', () => {
    const errors = validateRecipeIngredients(INDIAN_NON_VEG_RECIPES);
    expect(errors).toEqual([]);
    expect(INDIAN_NON_VEG_RECIPES.length).toBe(12);
  });

  it('has valid ingredients and matching dimensions for all Indian Veg party recipes', () => {
    const errors = validateRecipeIngredients(INDIAN_VEG_PARTY_RECIPES);
    expect(errors).toEqual([]);
    expect(INDIAN_VEG_PARTY_RECIPES.length).toBe(22);
  });

  it('filters recipes accurately by dietary preference (veg vs non-veg)', () => {
    const inEligible = GLOBAL_RECIPES.filter((r) =>
      isRecipeEligibleForLocation(r, 'India & South Asia'),
    );
    const vegOnly = inEligible.filter((r) => matchesDietaryFilter(r.diet, 'veg'));
    const nonVegOnly = inEligible.filter((r) => matchesDietaryFilter(r.diet, 'non-veg'));
    expect(vegOnly.length).toBeGreaterThanOrEqual(20);
    expect(nonVegOnly.length).toBe(12);
    expect(
      vegOnly.every((r) => r.diet === 'vegetarian' || r.diet === 'vegan' || r.diet === 'jain'),
    ).toBe(true);
    expect(nonVegOnly.every((r) => r.diet === 'non-vegetarian' || r.diet === 'eggetarian')).toBe(
      true,
    );
  });

  it('filters catalog recipes correctly by culinary continent', () => {
    const all = GLOBAL_RECIPES;

    const inEligible = all.filter((r) => isRecipeEligibleForLocation(r, 'India & South Asia'));
    expect(inEligible.length).toBe(
      RECIPES.length +
        SOUTH_ASIA_RECIPES.length +
        INDIAN_NON_VEG_RECIPES.length +
        INDIAN_VEG_PARTY_RECIPES.length,
    );
    expect(inEligible.some((r) => r.id === 'idli-sambar')).toBe(true);
    expect(inEligible.some((r) => r.id === 'hyderabadi-biryani')).toBe(true);
    expect(inEligible.some((r) => r.id === 'butter-chicken')).toBe(true);
    expect(inEligible.some((r) => r.id === 'mutton-rogan-josh')).toBe(true);
    expect(inEligible.some((r) => r.id === 'dal-makhani')).toBe(true);
    expect(inEligible.some((r) => r.id === 'kadhai-paneer')).toBe(true);
    expect(inEligible.some((r) => r.id === 'matar-pulao')).toBe(true);
    expect(inEligible.some((r) => r.id === 'butter-naan')).toBe(true);

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

  it('provides authentic festival & occasion lists for all 6 culinary continents', () => {
    for (const region of CULINARY_REGIONS) {
      const occs = getOccasionsForRegion(region.name);
      expect(occs.length).toBeGreaterThanOrEqual(5);
      expect(occs).toContain(region.defaultOccasion);
    }

    const sa = getOccasionsForRegion('India & South Asia');
    expect(sa).toContain('Diwali & Festive Feasts');
    expect(sa).toContain('South Indian Festive Feast');

    const na = getOccasionsForRegion('North America');
    expect(na).toContain('Thanksgiving Dinner');
    expect(na).toContain('4th of July / Summer BBQ');

    const eu = getOccasionsForRegion('Europe & Mediterranean');
    expect(eu).toContain('Christmas Eve (Reveillon / Vigilia)');
    expect(eu).toContain('Sunday Family Pranzo');

    const asia = getOccasionsForRegion('East & Pan-Asian');
    expect(asia).toContain('Lunar New Year / Spring Festival');
    expect(asia).toContain('Dim Sum Brunch & Tea');

    const me = getOccasionsForRegion('Middle East & Levantine');
    expect(me).toContain('Eid al-Fitr Feast');
    expect(me).toContain('Friday Family Mezze & Grill');

    const la = getOccasionsForRegion('Latin America & Mexican');
    expect(la).toContain('Día de los Muertos Fiesta');
    expect(la).toContain('Cinco de Mayo Celebration');
  });

  it('recommends specific authentic dishes for continental festivals', () => {
    const thanksgiving = recommendMenu({
      location: 'North America',
      country: 'US',
      occasion: 'Thanksgiving Dinner',
      availableRecipes: GLOBAL_RECIPES,
    });
    expect(
      thanksgiving.some((r) => r.id === 'bbq-pulled-chicken' || r.id === 'mac-and-cheese'),
    ).toBe(true);
    expect(thanksgiving.some((r) => r.id === 'apple-pie')).toBe(true);

    const southFeast = recommendMenu({
      location: 'India & South Asia',
      country: 'IN',
      occasion: 'South Indian Festive Feast',
      availableRecipes: GLOBAL_RECIPES,
    });
    expect(southFeast.some((r) => r.id === 'masala-dosa')).toBe(true);
    expect(southFeast.some((r) => r.id === 'idli-sambar')).toBe(true);

    const christmasEve = recommendMenu({
      location: 'Europe & Mediterranean',
      country: 'US',
      occasion: 'Christmas Eve (Reveillon / Vigilia)',
      availableRecipes: GLOBAL_RECIPES,
    });
    expect(christmasEve.some((r) => r.id === 'margherita-pizza' || r.id === 'veggie-lasagna')).toBe(
      true,
    );
    expect(christmasEve.some((r) => r.id === 'classic-tiramisu')).toBe(true);

    const eid = recommendMenu({
      location: 'Middle East & Levantine',
      country: 'US',
      occasion: 'Eid al-Fitr Feast',
      availableRecipes: GLOBAL_RECIPES,
    });
    expect(eid.some((r) => r.id === 'falafel-platter' || r.id === 'hummus-pita')).toBe(true);
    expect(eid.some((r) => r.id === 'mandi-rice')).toBe(true);
  });

  it('verifies that every recipe thumbnail exists on disk without broken images', () => {
    const publicFoodDir = path.resolve(__dirname, '../../apps/web/public');
    for (const recipe of GLOBAL_RECIPES) {
      expect(recipe.thumbnailUrl).toBeTruthy();
      const url = recipe.thumbnailUrl ?? '';
      const relativePath = url.startsWith('/') ? url.slice(1) : url;
      const fullPath = path.join(publicFoodDir, relativePath);
      expect(fs.existsSync(fullPath), `Missing image file for ${recipe.id}: ${fullPath}`).toBe(
        true,
      );
    }
  });
});
