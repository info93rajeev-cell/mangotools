import { CATALOG_INGREDIENTS, type ExtendedFoodRecipe } from './foodReferenceData.ts';

export interface IngredientLineItem {
  id: string;
  name: string;
  aisle: string;
  quantity: string;
  unit: string;
  usedIn: string[];
  allergens: string[];
}

export function extractIngredientLines(
  engineConsolidated: unknown,
  selectedRecipes: ExtendedFoodRecipe[],
  guests: number,
  servingsPerGuest: number,
): IngredientLineItem[] {
  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));

  if (!cons?.lines) {
    const agg = new Map<string, { total: number; unit: string; usedIn: Set<string> }>();
    for (const recipe of selectedRecipes) {
      const factor = (guests * servingsPerGuest) / recipe.servings;
      for (const ing of recipe.ingredients) {
        const entry = agg.get(ing.ingredient) ?? { total: 0, unit: ing.unit, usedIn: new Set() };
        entry.total += Number.parseFloat(ing.quantity) * factor;
        entry.usedIn.add(recipe.name);
        agg.set(ing.ingredient, entry);
      }
    }
    return Array.from(agg.entries()).map(([ingId, data]) => {
      const cat = catalogMap.get(ingId);
      return {
        id: ingId,
        name: cat?.name ?? ingId,
        aisle: cat?.aisle ?? 'other',
        quantity: formatDisplayQty(data.total, data.unit),
        unit: formatDisplayUnit(data.total, data.unit),
        usedIn: Array.from(data.usedIn),
        allergens: cat?.allergens ?? [],
      };
    });
  }

  return cons.lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const usedIn = selectedRecipes
      .filter((r) => r.ingredients.some((i) => i.ingredient === l.ingredient))
      .map((r) => r.name);
    const num = Number.parseFloat(l.total);
    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      quantity: formatDisplayQty(num, l.unit),
      unit: formatDisplayUnit(num, l.unit),
      usedIn,
      allergens: cat?.allergens ?? [],
    };
  });
}

export function formatDisplayQty(val: number, unit: string): string {
  if (unit === 'g' && val >= 1000) return (val / 1000).toFixed(2);
  if (unit === 'ml' && val >= 1000) return (val / 1000).toFixed(2);
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

export function formatDisplayUnit(val: number, unit: string): string {
  if (unit === 'g' && val >= 1000) return 'kg';
  if (unit === 'ml' && val >= 1000) return 'L';
  return unit;
}

export function getAisleColor(aisle: string): string {
  if (aisle === 'vegetables' || aisle === 'herbs') return '#22c55e';
  if (aisle === 'dairy') return '#0284c7';
  if (aisle === 'spices') return '#ef4444';
  if (aisle === 'grains' || aisle === 'pulses') return '#f59e0b';
  return '#8b5cf6';
}
