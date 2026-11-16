import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

const BUFFET_TIERS: Record<number, number> = {
  1: 1,
  2: 0.6,
  3: 0.45,
  4: 0.35,
};

const TREAT_TIERS: Record<number, number> = {
  1: 1,
  2: 0.65,
  3: 0.5,
  4: 0.4,
};

/**
 * Calculates menu breadth diversity scaling.
 * When a feast menu includes multiple dishes across courses
 * (e.g. 1 rice, 1 bread, 2 curries, 1 side, 1 dessert), diners eat smaller
 * portions of each dish rather than consuming 100% full meals for every single dish.
 * This ensures 20 guests eat ~10-12 kg of food, avoiding massive over-catering and food waste.
 */
export function getMenuBreadthFactor(totalDishes: number): number {
  if (totalDishes <= 7) return 1.0;
  if (totalDishes === 8) return 0.85;
  if (totalDishes === 9) return 0.75;
  if (totalDishes === 10) return 0.65;
  return Math.max(0.35, Number((6.5 / totalDishes).toFixed(2)));
}

/**
 * Calculates the catering buffet portion factor for a dish based on course, variety count, and total menu size.
 *
 * Real-world catering guidelines:
 * - When guests have 1 option in a course in a standard menu (<= 7 dishes): full preparation (factor = 1.0).
 * - When multiple options in the same course (e.g. 2 rices or 2 curries): intra-course balancing (60% / 45% each).
 * - When multi-course banquet expands to 8+ dishes: breadth scaling gently balances total meal volume.
 */
export function getCateringBalancedPortion(
  course: string,
  courseCount: number,
  totalDishes = 1,
): number {
  if (courseCount <= 1 && totalDishes <= 7) return 1;

  const isTreat = course === 'snack' || course === 'dessert' || course === 'drink';
  const table = isTreat ? TREAT_TIERS : BUFFET_TIERS;
  const courseFactor = table[courseCount] ?? Math.max(0.25, Number((1.4 / courseCount).toFixed(2)));

  if (totalDishes <= 7) {
    return courseFactor;
  }

  const breadth = getMenuBreadthFactor(totalDishes);
  const composite = courseCount > 1 ? courseFactor * Math.max(0.7, breadth) : breadth;
  return Math.max(0.25, Number(composite.toFixed(2)));
}

/**
 * Computes effective portion factors for all selected recipes.
 * Explicit user customizations are retained; uncustomized dishes scale
 * dynamically based on category variety and overall menu size to prevent over-catering and food waste.
 */
export function getEffectivePortionFactors(
  selectedRecipes: ExtendedFoodRecipe[],
  customPortions: Record<string, number>,
): Record<string, number> {
  const totalDishes = selectedRecipes.length;
  const courseCounts: Record<string, number> = {};
  for (const r of selectedRecipes) {
    const c = r.course || 'other';
    courseCounts[c] = (courseCounts[c] || 0) + 1;
  }

  const effective: Record<string, number> = {};
  for (const r of selectedRecipes) {
    if (customPortions[r.id] !== undefined) {
      effective[r.id] = customPortions[r.id];
    } else {
      const c = r.course || 'other';
      effective[r.id] = getCateringBalancedPortion(c, courseCounts[c] || 1, totalDishes);
    }
  }
  return effective;
}

/**
 * Recalculates balanced portion factors for all dishes in the menu, resetting any custom overrides.
 */
export function computeAutoBalancedPortions(
  selectedRecipes: ExtendedFoodRecipe[],
): Record<string, number> {
  const totalDishes = selectedRecipes.length;
  const courseCounts: Record<string, number> = {};
  for (const r of selectedRecipes) {
    const c = r.course || 'other';
    courseCounts[c] = (courseCounts[c] || 0) + 1;
  }

  const result: Record<string, number> = {};
  for (const r of selectedRecipes) {
    const c = r.course || 'other';
    result[r.id] = getCateringBalancedPortion(c, courseCounts[c] || 1, totalDishes);
  }
  return result;
}
