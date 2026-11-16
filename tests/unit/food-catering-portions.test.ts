import { describe, expect, it } from 'vitest';
import {
  computeAutoBalancedPortions,
  getCateringBalancedPortion,
  getEffectivePortionFactors,
} from '../../packages/ui/src/toolkit/food-planner/cateringPortions.ts';
import type { ExtendedFoodRecipe } from '../../packages/ui/src/toolkit/food-planner/foodRecipesTypes.ts';

function createMockRecipe(id: string, course: ExtendedFoodRecipe['course']): ExtendedFoodRecipe {
  return {
    id,
    version: '1.0.0',
    name: id,
    course,
    cuisine: 'North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    ingredients: [],
    steps: ['step 1'],
    verified: true,
  };
}

describe('Catering Portion Balancing Engine', () => {
  it('returns full portion (1.0) when only 1 dish is selected in a course', () => {
    expect(getCateringBalancedPortion('rice', 1)).toBe(1);
    expect(getCateringBalancedPortion('main', 1)).toBe(1);
    expect(getCateringBalancedPortion('dal', 1)).toBe(1);
    expect(getCateringBalancedPortion('bread', 1)).toBe(1);
    expect(getCateringBalancedPortion('dessert', 1)).toBe(1);
  });

  it('scales down rice and main curries to 60% when 2 dishes are in the course', () => {
    expect(getCateringBalancedPortion('rice', 2)).toBe(0.6);
    expect(getCateringBalancedPortion('main', 2)).toBe(0.6);
    expect(getCateringBalancedPortion('dal', 2)).toBe(0.6);
    expect(getCateringBalancedPortion('bread', 2)).toBe(0.6);
  });

  it('scales down rice dishes to 45% when 3 dishes are in the course (e.g. Jeera Rice + Pulao + Biryani)', () => {
    expect(getCateringBalancedPortion('rice', 3)).toBe(0.45);
    expect(getCateringBalancedPortion('main', 3)).toBe(0.45);
  });

  it('computes effective portion factors dynamically across a multi-course menu', () => {
    const recipes = [
      createMockRecipe('jeera-rice', 'rice'),
      createMockRecipe('veg-pulao', 'rice'),
      createMockRecipe('dum-biryani', 'rice'),
      createMockRecipe('shahi-paneer', 'main'),
      createMockRecipe('aloo-gobi', 'main'),
      createMockRecipe('dal-tadka', 'dal'),
      createMockRecipe('gulab-jamun', 'dessert'),
    ];

    const factors = getEffectivePortionFactors(recipes, {});

    // Intra-course balancing scales multiple dishes in the same course:
    // 3 rice dishes: scaled to 45% each
    expect(factors['jeera-rice']).toBe(0.45);
    expect(factors['veg-pulao']).toBe(0.45);
    expect(factors['dum-biryani']).toBe(0.45);

    // 2 main curries: scaled to balanced 60% each
    expect(factors['shahi-paneer']).toBe(0.6);
    expect(factors['aloo-gobi']).toBe(0.6);

    // 1 dal & 1 dessert: 1.0 each in standard menu
    expect(factors['dal-tadka']).toBe(1);
    expect(factors['gulab-jamun']).toBe(1);
  });

  it('preserves user custom overrides while auto-scaling remaining dishes', () => {
    const recipes = [
      createMockRecipe('jeera-rice', 'rice'),
      createMockRecipe('veg-pulao', 'rice'),
      createMockRecipe('dum-biryani', 'rice'),
    ];

    // User explicitly sets dum-biryani to 0.75
    const custom = { 'dum-biryani': 0.75 };
    const factors = getEffectivePortionFactors(recipes, custom);

    expect(factors['dum-biryani']).toBe(0.75);
    expect(factors['jeera-rice']).toBe(0.45);
    expect(factors['veg-pulao']).toBe(0.45);
  });

  it('computeAutoBalancedPortions recalculates the clean standard portions for all dishes', () => {
    const recipes = [createMockRecipe('jeera-rice', 'rice'), createMockRecipe('veg-pulao', 'rice')];

    const balanced = computeAutoBalancedPortions(recipes);
    expect(balanced).toEqual({
      'jeera-rice': 0.6,
      'veg-pulao': 0.6,
    });
  });
});
