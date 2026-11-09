import { useMemo } from 'preact/hooks';
import { CATALOG_INGREDIENTS, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { getIngredientThumbnail } from './ingredientsUtils.ts';
import { priceBasis } from './plannerPrices.ts';
import { money } from './plannerResults.ts';

export interface ShoppingLineItem {
  id: string;
  name: string;
  aisle: string;
  buyQuantity: string;
  requiredQuantity?: string;
  requiredUnit?: string;
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
  _portionFactors: Record<string, number>,
  _guests: number,
  _servingsPerGuest: number,
  boughtItems: Record<string, boolean>,
  engineCost: unknown = null,
  priceMode: 'retail' | 'wholesale' = 'retail',
  userPrices: Record<string, string> = {},
  includeStock: boolean = false,
): ShoppingLineItem[] {
  if (selectedRecipes.length === 0) return [];

  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));

  const lines = (cons?.lines ?? []).filter(
    (line) => Number(line.buy) > 0 || (includeStock && Number(line.total) > 0),
  );

  return lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const pr = priceBasis(l.ingredient, priceMode);
    const rate = userPrices[l.ingredient] ?? ('priceInr' in pr ? pr.priceInr : undefined);
    const buyNum = Number.parseFloat(l.buy) || 0;
    const costs = engineCost as { items?: Array<{ ingredient: string; costInr: string }> } | null;
    const actual = costs?.items?.find((item) => item.ingredient === l.ingredient);
    const estCost = Number(actual?.costInr ?? '0');
    const priceLabel = rate !== undefined ? `${money(rate)} / ${pr.per} ${pr.unit}` : '—';

    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      buyQuantity: formatDisplayBuy(buyNum, l.unit),
      requiredQuantity: formatDisplayBuy(Number(l.total), l.unit),
      requiredUnit: formatDisplayBuyUnit(Number(l.total), l.unit),
      unit: formatDisplayBuyUnit(buyNum, l.unit),
      priceLabel,
      estCost,
      storeType: getStoreTypeForAisle(cat?.aisle ?? 'other'),
      isBought: !!boughtItems[l.ingredient],
      thumbnailUrl: getIngredientThumbnail(l.ingredient),
    };
  });
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
  engineCost: unknown = null,
  priceMode: 'retail' | 'wholesale' = 'retail',
  userPrices: Record<string, string> = {},
  categories: Record<string, string> = {},
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
        engineCost,
        priceMode,
        userPrices,
      ).map((item) => ({ ...item, aisle: categories[item.id] ?? item.aisle })),
    [
      engineConsolidated,
      selectedRecipes,
      portionFactors,
      guests,
      servingsPerGuest,
      boughtItems,
      engineCost,
      priceMode,
      userPrices,
      categories,
    ],
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
