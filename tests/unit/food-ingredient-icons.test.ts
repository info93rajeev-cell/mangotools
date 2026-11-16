import { describe, expect, it } from 'vitest';
import {
  DISTINCT_INGREDIENT_ICONS,
  getDistinctIngredientVisual,
} from '../../packages/ui/src/toolkit/food-planner/ingredientIconsRegistry.ts';

describe('Food Planner Ingredient Icons & Visual Identity', () => {
  it('covers extensive core recipe ingredients with distinct visual entries', () => {
    expect(Object.keys(DISTINCT_INGREDIENT_ICONS).length).toBeGreaterThanOrEqual(150);
  });

  it('guarantees distinct icons between common spices, produce and oils', () => {
    const mango = getDistinctIngredientVisual('dry-mango-powder', 'Dry mango powder', 'spices');
    const hing = getDistinctIngredientVisual('asafoetida', 'Asafoetida', 'spices');
    const bayLeaf = getDistinctIngredientVisual('bay-leaf', 'Bay leaf', 'spices');
    const oil = getDistinctIngredientVisual('cooking-oil', 'Cooking oil', 'oil-ghee');
    const rice = getDistinctIngredientVisual('basmati-rice', 'Basmati rice', 'grains');

    expect(mango.icon).toBe('🥭');
    expect(hing.icon).toBe('🌿');
    expect(bayLeaf.icon).toBe('🍃');
    expect(oil.icon).toBe('🫒');
    expect(rice.icon).toBe('🍚');

    // Ensure none of these distinct ingredients share the same icon
    const icons = new Set([mango.icon, hing.icon, bayLeaf.icon, oil.icon, rice.icon]);
    expect(icons.size).toBe(5);
  });

  it('correctly resolves plural and singular ingredient variations', () => {
    const singularCarrot = getDistinctIngredientVisual('carrot');
    const pluralCarrots = getDistinctIngredientVisual('carrots');
    expect(singularCarrot.icon).toBe(pluralCarrots.icon);
    expect(pluralCarrots.icon).toBe('🥕');

    const pluralApples = getDistinctIngredientVisual('apples');
    expect(pluralApples.icon).toBe('🍎');
  });

  it('provides safe contrast and non-empty visuals for all entries', () => {
    for (const [id, visual] of Object.entries(DISTINCT_INGREDIENT_ICONS)) {
      expect(visual.icon, `Missing icon for ${id}`).toBeTruthy();
      expect(visual.bg, `Missing bg for ${id}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(visual.color, `Missing color for ${id}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
