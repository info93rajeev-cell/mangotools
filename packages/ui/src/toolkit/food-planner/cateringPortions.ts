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
 * Calculates the catering buffet portion factor for a dish based on course and variety count.
 *
 * Real-world catering guidelines:
 * - When guests have 1 option in a course: 100% preparation (factor = 1.0).
 * - When 2 options (e.g. Jeera Rice + Veg Pulao): ~60% each (120% total buffet buffer).
 * - When 3 options (e.g. Jeera Rice + Pulao + Dum Biryani): ~45% each (135% total buffet buffer).
 * - When 4 options: ~35% each (140% total buffer).
 * - When 5+ options: max(0.25, round(buffer / count, 2)).
 */
export function getCateringBalancedPortion(course: string, courseCount: number): number {
  if (courseCount <= 1) return 1;

  const isTreat = course === 'snack' || course === 'dessert' || course === 'drink';
  const table = isTreat ? TREAT_TIERS : BUFFET_TIERS;
  const buffer = isTreat ? 1.5 : 1.4;

  return table[courseCount] ?? Math.max(0.25, Number((buffer / courseCount).toFixed(2)));
}

/**
 * Computes effective portion factors for all selected recipes.
 * Explicit user customizations are retained; uncustomized dishes scale
 * dynamically based on category variety to prevent over-catering and food waste.
 */
export function getEffectivePortionFactors(
  selectedRecipes: ExtendedFoodRecipe[],
  customPortions: Record<string, number>,
): Record<string, number> {
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
      effective[r.id] = getCateringBalancedPortion(c, courseCounts[c] || 1);
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
  const courseCounts: Record<string, number> = {};
  for (const r of selectedRecipes) {
    const c = r.course || 'other';
    courseCounts[c] = (courseCounts[c] || 0) + 1;
  }

  const result: Record<string, number> = {};
  for (const r of selectedRecipes) {
    const c = r.course || 'other';
    result[r.id] = getCateringBalancedPortion(c, courseCounts[c] || 1);
  }
  return result;
}
