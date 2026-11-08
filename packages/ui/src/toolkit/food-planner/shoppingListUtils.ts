import { useMemo } from 'preact/hooks';
import {
  CATALOG_INGREDIENTS,
  type ExtendedFoodRecipe,
  REFERENCE_PRICES,
} from './foodReferenceData.ts';
import { getIngredientThumbnail } from './ingredientsUtils.ts';

export interface ShoppingLineItem {
  id: string;
  name: string;
  aisle: string;
  buyQuantity: string;
  unit: string;
  priceLabel: string;
  estCost: number;
  storeType: string;
  isBought: boolean;
  thumbnailUrl?: string;
}

export function buildShoppingItems(
  engineConsolidated: unknown,
  selectedRecipes: ExtendedFoodRecipe[],
  portionFactors: Record<string, number>,
  guests: number,
  servingsPerGuest: number,
  boughtItems: Record<string, boolean>,
): ShoppingLineItem[] {
  if (selectedRecipes.length === 0) return [];

  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));
  const priceMap = new Map(
    REFERENCE_PRICES.filter((p) => p.kind === 'retail-reference').map((p) => [p.ingredient, p]),
  );

  let lines: Array<{ ingredient: string; buy: string; unit: string }> = [];

  if (cons?.lines && cons.lines.length > 0) {
    lines = cons.lines;
  } else {
    // Immediate synchronous fallback so shopping list is populated reliably on initial render
    const agg = new Map<string, { total: number; unit: string }>();
    for (const recipe of selectedRecipes) {
      const factor =
        (guests * servingsPerGuest * (portionFactors[recipe.id] ?? 1)) / recipe.servings;
      for (const ing of recipe.ingredients) {
        const entry = agg.get(ing.ingredient) ?? { total: 0, unit: ing.unit };
        entry.total += Number.parseFloat(ing.quantity) * factor;
        agg.set(ing.ingredient, entry);
      }
    }
    lines = Array.from(agg.entries()).map(([ingredient, data]) => {
      let buy = data.total;
      let unit = data.unit;
      if (unit === 'kg') {
        buy *= 1000;
        unit = 'g';
      } else if (unit === 'l') {
        buy *= 1000;
        unit = 'ml';
      } else if (unit === 'tbsp') {
        buy *= 15;
        unit = 'ml';
      } else if (unit === 'tsp') {
        buy *= 5;
        unit = 'ml';
      } else if (unit === 'cup') {
        buy *= 240;
        unit = 'ml';
      }
      return {
        ingredient,
        buy: String(Math.ceil(buy)),
        unit,
      };
    });
  }

  return lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const pr = priceMap.get(l.ingredient);
    const buyNum = Number.parseFloat(l.buy) || 0;
    const estCost = computeLineCost(buyNum, l.unit, pr?.priceInr, pr?.per, pr?.unit);
    const priceLabel = pr ? `₹${pr.priceInr} / ${pr.unit}` : '—';

    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      buyQuantity: formatDisplayBuy(buyNum, l.unit),
      unit: formatDisplayBuyUnit(buyNum, l.unit),
      priceLabel,
      estCost: Math.round(estCost),
      storeType: getStoreTypeForAisle(cat?.aisle ?? 'other'),
      isBought: !!boughtItems[l.ingredient],
      thumbnailUrl: getIngredientThumbnail(l.ingredient),
    };
  });
}

function computeLineCost(
  buyNum: number,
  lineUnit: string,
  priceInr?: string,
  per?: string,
  priceUnit?: string,
): number {
  if (!priceInr || !per || !priceUnit) return 0;
  const rate = Number.parseFloat(priceInr);
  const p = Number.parseFloat(per);

  if (lineUnit === 'g' && priceUnit === 'kg') {
    return (buyNum / 1000) * (rate / p);
  }
  if (lineUnit === 'ml' && (priceUnit === 'l' || priceUnit === '1000')) {
    return (buyNum / 1000) * (rate / p);
  }
  return (buyNum / p) * rate;
}

function formatDisplayBuy(num: number, unit: string): string {
  if (unit === 'g' && num >= 1000) return (num / 1000).toFixed(2);
  if (unit === 'ml' && num >= 1000) return (num / 1000).toFixed(2);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function formatDisplayBuyUnit(num: number, unit: string): string {
  if (unit === 'g' && num >= 1000) return 'kg';
  if (unit === 'ml' && num >= 1000) return 'L';
  return unit;
}

export function getStoreTypeForAisle(aisle: string): string {
  if (aisle === 'vegetables' || aisle === 'herbs') return 'Sabzi Mandi / Veg Vendor';
  if (aisle === 'dairy') return 'Dairy / Milk Booth';
  if (aisle === 'spices') return 'Spice Merchant / Kirana';
  if (aisle === 'grains' || aisle === 'pulses') return 'Grocery Wholesale / Retail';
  return 'General Store';
}

export function useGroupedShoppingItems(
  engineConsolidated: unknown,
  selectedRecipes: ExtendedFoodRecipe[],
  portionFactors: Record<string, number>,
  guests: number,
  servingsPerGuest: number,
  boughtItems: Record<string, boolean>,
) {
  const shoppingItems = useMemo(
    () =>
      buildShoppingItems(
        engineConsolidated,
        selectedRecipes,
        portionFactors,
        guests,
        servingsPerGuest,
        boughtItems,
      ),
    [engineConsolidated, selectedRecipes, portionFactors, guests, servingsPerGuest, boughtItems],
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingLineItem[]> = {};
    for (const item of shoppingItems) {
      if (!groups[item.aisle]) groups[item.aisle] = [];
      groups[item.aisle].push(item);
    }
    return groups;
  }, [shoppingItems]);

  const totalItems = shoppingItems.length;
  const inListCount = shoppingItems.filter((i) => i.isBought).length;
  const toBuyCount = totalItems - inListCount;

  return { shoppingItems, groupedItems, totalItems, inListCount, toBuyCount };
}
