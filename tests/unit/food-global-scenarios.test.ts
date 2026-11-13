import { createTestContext, executeOperation, type Result } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import {
  costEstimate,
  scheduleGenerate,
  shoppingConsolidate,
} from '../../engines/food/src/index.ts';
import { unitOf } from '../../engines/food/src/units.ts';
import {
  CATALOG_INGREDIENTS,
  type FoodPriceItem,
  GLOBAL_RECIPES,
  REFERENCE_PRICES,
  REFERENCE_PRICES_US,
  US_RECIPES,
} from '../../packages/ui/src/toolkit/food-planner/foodReferenceData.ts';
import {
  formatCurrency,
  getCurrencyForCountry,
  getCurrencySymbol,
  getDefaultOtherExpenses,
} from '../../packages/ui/src/toolkit/food-planner/plannerCurrency.ts';
import { recommendMenu } from '../../packages/ui/src/toolkit/food-planner/plannerMenuRecommendation.ts';
import {
  formatShoppingUnit,
  getUnitSystemForCountry,
} from '../../packages/ui/src/toolkit/food-planner/plannerUnits.ts';

describe('Global Food Planner Scenarios & Verification', () => {
  it('contains 16 authentic, source-checked American recipes', () => {
    expect(US_RECIPES.length).toBe(16);
    for (const recipe of US_RECIPES) {
      expect(recipe.countries).toContain('US');
      expect(recipe.sources).toBeDefined();
      expect(recipe.sources?.length).toBeGreaterThanOrEqual(2);
      expect(recipe.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
      expect(recipe.proTips?.length).toBeGreaterThanOrEqual(2);
      expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
      expect(recipe.verification?.status).toBe('source-checked');
      expect(recipe.thumbnailUrl).toBe(`/food/recipes/${recipe.id}.jpg`);
    }
  });

  function validateRecipeIngredient(
    recipeId: string,
    ing: { ingredient: string; unit: string },
    catalogMap: Map<string, { dimension: string }>,
  ): string | null {
    const found = catalogMap.get(ing.ingredient);
    if (!found) return `${recipeId}: unknown ingredient ${ing.ingredient}`;
    const unitDef = unitOf(ing.unit);
    if (!unitDef) return `${recipeId}: unknown unit ${ing.unit} for ${ing.ingredient}`;
    if (unitDef.dimension !== found.dimension) {
      return `${recipeId}: dimension mismatch for ${ing.ingredient} (unit ${ing.unit} is ${unitDef.dimension}, ingredient is ${found.dimension})`;
    }
    return null;
  }

  it('has valid ingredients and matching dimensions for all US recipes', () => {
    const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));
    const errors: string[] = [];
    for (const recipe of US_RECIPES) {
      for (const ing of recipe.ingredients) {
        const err = validateRecipeIngredient(recipe.id, ing, catalogMap);
        if (err) errors.push(err);
      }
    }
    expect(errors).toEqual([]);
  });

  describe('Scenario A: India (Delhi, 50 Guests, Birthday Dinner, INR)', () => {
    const country = 'IN';
    const occasion = 'Birthday Party';
    const guests = 50;

    it('correctly resolves currency and units for India', () => {
      const currency = getCurrencyForCountry(country);
      expect(currency).toBe('INR');
      expect(getCurrencySymbol(currency)).toBe('₹');
      expect(getUnitSystemForCountry(country)).toBe('metric');

      const formatted = formatCurrency(1250, currency);
      expect(formatted).toBe('₹1,250');

      const otherExpenses = getDefaultOtherExpenses(currency);
      expect(otherExpenses.length).toBe(4);
      expect(otherExpenses[0].name).toContain('Cooking Gas');
    });

    it('recommends an authentic Indian multi-course dinner menu', () => {
      const menu = recommendMenu({
        country,
        occasion,
        mealType: 'Dinner',
        diet: 'all',
        guests,
        availableRecipes: GLOBAL_RECIPES,
      });

      const menuIds = menu.map((r) => r.id);
      expect(menuIds).toContain('jeera-rice');
      expect(menuIds).toContain('dal-tadka');
      expect(menuIds).toContain('shahi-paneer');
      expect(menuIds).toContain('gulab-jamun');
      expect(menu.length).toBeGreaterThanOrEqual(4);
    });

    it('consolidates shopping, estimates costs, and generates schedule in INR', async () => {
      const indianMenu = GLOBAL_RECIPES.filter((r) =>
        ['jeera-rice', 'dal-tadka', 'shahi-paneer', 'gulab-jamun'].includes(r.id),
      );
      const selection = indianMenu.map((r) => ({
        recipe: r.id,
        recipeVersion: r.version,
        portionFactor: '1',
      }));

      // Shopping engine
      const shoppingRes = (await executeOperation(
        shoppingConsolidate,
        {
          ingredients: CATALOG_INGREDIENTS,
          recipes: indianMenu,
          selection,
          guests,
          servingsPerGuest: '1',
        },
        { diet: 'none', dietPolicy: 'flag' },
        createTestContext(),
      )) as Result<{ lines: Array<{ ingredient: string; buy: string; unit: string }> }>;
      if (!shoppingRes.ok) {
        throw new Error(`Scenario A shopping error: ${JSON.stringify(shoppingRes.error)}`);
      }
      expect(shoppingRes.ok).toBe(true);
      expect(shoppingRes.value.lines.length).toBeGreaterThan(0);

      // Cost engine
      const cleanLines = shoppingRes.value.lines.map(
        (l: { ingredient: string; buy: string; unit: string }) => ({
          ingredient: l.ingredient,
          buy: l.buy,
          unit: l.unit as 'g' | 'ml' | 'piece',
        }),
      );

      const costRes = (await executeOperation(
        costEstimate,
        {
          guests,
          lines: cleanLines,
          prices: REFERENCE_PRICES,
        },
        { pricePriority: 'retail-only', quantityBasis: 'buy' },
        createTestContext(),
      )) as Result<{ totalCostInr: string; lineCosts: unknown[] }>;
      if (!costRes.ok) {
        throw new Error(`Scenario A cost error: ${JSON.stringify(costRes.error)}`);
      }
      expect(costRes.ok).toBe(true);
      expect(Number(costRes.value.totalCostInr)).toBeGreaterThan(500);

      // Schedule engine
      const scheduleSelection = indianMenu.map((r) => ({
        recipe: r.id,
        recipeVersion: r.version,
      }));
      const scheduleRes = (await executeOperation(
        scheduleGenerate,
        {
          recipes: indianMenu,
          selection: scheduleSelection,
          guests,
          mealTime: '19:00',
          burnersAvailable: 3,
          prepStations: 1,
        },
        { restMinutes: 10, prepScaleFactor: 'logarithmic' },
        createTestContext(),
      )) as Result<{ timeline: unknown[]; totalSpanMinutes: number }>;
      if (!scheduleRes.ok) {
        throw new Error(`Scenario A schedule error: ${JSON.stringify(scheduleRes.error)}`);
      }
      expect(scheduleRes.ok).toBe(true);
      expect(scheduleRes.value.timeline.length).toBeGreaterThan(0);
      expect(scheduleRes.value.totalSpanMinutes).toBeGreaterThan(0);
    });
  });

  describe('Scenario B: USA (New York, 50 Guests, Birthday Dinner, USD)', () => {
    const country = 'US';
    const occasion = 'Birthday Party';
    const guests = 50;

    it('correctly resolves currency and units for USA', () => {
      const currency = getCurrencyForCountry(country);
      expect(currency).toBe('USD');
      expect(getCurrencySymbol(currency)).toBe('$');
      expect(getUnitSystemForCountry(country)).toBe('us-customary');

      const formatted = formatCurrency(125.5, currency, { showDecimals: true });
      expect(formatted).toBe('$125.50');

      const otherExpenses = getDefaultOtherExpenses(currency);
      expect(otherExpenses.length).toBe(4);
      expect(otherExpenses[0].name).toContain('Sterno Cans');
    });

    it('recommends an authentic American multi-course dinner menu', () => {
      const menu = recommendMenu({
        country,
        occasion,
        mealType: 'Dinner',
        diet: 'all',
        guests,
        availableRecipes: GLOBAL_RECIPES,
      });

      const menuIds = menu.map((r) => r.id);
      expect(menuIds).toContain('mac-and-cheese');
      expect(menuIds).toContain('bbq-pulled-chicken');
      expect(menuIds).toContain('mashed-potatoes');
      expect(menuIds).toContain('caesar-salad');
      expect(menuIds).toContain('new-york-cheesecake');
      expect(menu.length).toBeGreaterThanOrEqual(4);
    });

    it('formats US Customary retail units (lb, oz, gal, fl oz)', () => {
      // 1000g of potatoes -> 2.2 lb
      const potatoDisplay = formatShoppingUnit(1000, 'mass', 'us-customary');
      expect(potatoDisplay.displayUnit).toBe('lb');
      expect(Number(potatoDisplay.displayQuantity)).toBeCloseTo(2.2, 1);

      // 100g of cheese -> 4 oz
      const cheeseDisplay = formatShoppingUnit(100, 'mass', 'us-customary');
      expect(cheeseDisplay.displayUnit).toBe('oz');
      expect(Number(cheeseDisplay.displayQuantity)).toBe(4);

      // 3800 ml of milk -> 1 gal
      const milkDisplay = formatShoppingUnit(3800, 'volume', 'us-customary');
      expect(milkDisplay.displayUnit).toBe('gal');
      expect(Number(milkDisplay.displayQuantity)).toBe(1);

      // 250 ml of cream -> 9 fl oz
      const creamDisplay = formatShoppingUnit(250, 'volume', 'us-customary');
      expect(creamDisplay.displayUnit).toBe('fl oz');
      expect(Number(creamDisplay.displayQuantity)).toBe(9);
    });

    it('consolidates shopping, estimates costs in USD, and generates schedule', async () => {
      const usMenu = GLOBAL_RECIPES.filter((r) =>
        [
          'mac-and-cheese',
          'bbq-pulled-chicken',
          'mashed-potatoes',
          'caesar-salad',
          'new-york-cheesecake',
        ].includes(r.id),
      );
      const selection = usMenu.map((r) => ({
        recipe: r.id,
        recipeVersion: r.version,
        portionFactor: '1',
      }));

      // Shopping engine
      const shoppingRes = (await executeOperation(
        shoppingConsolidate,
        {
          ingredients: CATALOG_INGREDIENTS,
          recipes: usMenu,
          selection,
          guests,
          servingsPerGuest: '1',
        },
        { diet: 'none', dietPolicy: 'flag' },
        createTestContext(),
      )) as Result<{ lines: Array<{ ingredient: string; buy: string; unit: string }> }>;
      if (!shoppingRes.ok) {
        throw new Error(`Scenario B shopping error: ${JSON.stringify(shoppingRes.error)}`);
      }
      expect(shoppingRes.ok).toBe(true);
      expect(shoppingRes.value.lines.length).toBeGreaterThan(0);

      // Cost engine
      const cleanLines = shoppingRes.value.lines.map(
        (l: { ingredient: string; buy: string; unit: string }) => ({
          ingredient: l.ingredient,
          buy: l.buy,
          unit: l.unit as 'g' | 'ml' | 'piece',
        }),
      );

      const costRes = (await executeOperation(
        costEstimate,
        {
          guests,
          lines: cleanLines,
          prices: REFERENCE_PRICES_US as unknown as FoodPriceItem[],
        },
        { pricePriority: 'retail-only', quantityBasis: 'buy' },
        createTestContext(),
      )) as Result<{ totalCostInr: string; lineCosts: unknown[] }>;
      if (!costRes.ok) {
        throw new Error(`Scenario B cost error: ${JSON.stringify(costRes.error)}`);
      }
      expect(costRes.ok).toBe(true);

      const totalUsd = Number(costRes.value.totalCostInr);
      expect(totalUsd).toBeGreaterThan(100);
      expect(totalUsd).toBeLessThan(1000);

      // Schedule engine
      const scheduleSelection = usMenu.map((r) => ({
        recipe: r.id,
        recipeVersion: r.version,
      }));
      const scheduleRes = (await executeOperation(
        scheduleGenerate,
        {
          recipes: usMenu,
          selection: scheduleSelection,
          guests,
          mealTime: '18:30',
          burnersAvailable: 4,
          prepStations: 2,
        },
        { restMinutes: 10, prepScaleFactor: 'logarithmic' },
        createTestContext(),
      )) as Result<{ timeline: unknown[]; totalSpanMinutes: number }>;
      if (!scheduleRes.ok) {
        throw new Error(`Scenario B schedule error: ${JSON.stringify(scheduleRes.error)}`);
      }
      expect(scheduleRes.ok).toBe(true);

      expect(scheduleRes.value.timeline.length).toBeGreaterThan(0);
      expect(scheduleRes.value.totalSpanMinutes).toBeGreaterThan(0);
    });
  });
});
