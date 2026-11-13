import { useMemo } from 'preact/hooks';
import { CATALOG_INGREDIENTS, type ExtendedFoodRecipe } from './foodReferenceData.ts';
import { getIngredientThumbnail } from './ingredientsUtils.ts';
import { priceBasis } from './plannerPrices.ts';
import { money } from './plannerResults.ts';
import { formatShoppingUnit } from './plannerUnits.ts';

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
  currency: string = 'INR',
): ShoppingLineItem[] {
  if (selectedRecipes.length === 0) return [];

  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));
  const isUS = currency === 'USD';

  const lines = (cons?.lines ?? []).filter(
    (line) => Number(line.buy) > 0 || (includeStock && Number(line.total) > 0),
  );

  return lines.map((l) => {
    const cat = catalogMap.get(l.ingredient);
    const pr = priceBasis(l.ingredient, priceMode, isUS);
    const rate = userPrices[l.ingredient] ?? ('priceInr' in pr ? pr.priceInr : undefined);
    const buyNum = Number.parseFloat(l.buy) || 0;
    const costs = engineCost as { items?: Array<{ ingredient: string; costInr: string }> } | null;
    const actual = costs?.items?.find((item) => item.ingredient === l.ingredient);
    const estCost = Number(actual?.costInr ?? '0');
    const priceLabel = rate !== undefined ? `${money(rate, currency)} / ${pr.per} ${pr.unit}` : '—';

    let displayBuyQty = formatDisplayBuy(buyNum, l.unit);
    let displayBuyUnit = formatDisplayBuyUnit(buyNum, l.unit);
    let displayReqQty = formatDisplayBuy(Number(l.total), l.unit);
    let displayReqUnit = formatDisplayBuyUnit(Number(l.total), l.unit);

    if (isUS && cat?.dimension) {
      const formattedBuy = formatShoppingUnit(buyNum, cat.dimension, 'us-customary');
      displayBuyQty = formattedBuy.displayQuantity;
      displayBuyUnit = formattedBuy.displayUnit;
      const formattedReq = formatShoppingUnit(Number(l.total), cat.dimension, 'us-customary');
      displayReqQty = formattedReq.displayQuantity;
      displayReqUnit = formattedReq.displayUnit;
    }

    return {
      id: l.ingredient,
      name: cat?.name ?? l.ingredient,
      aisle: cat?.aisle ?? 'other',
      buyQuantity: displayBuyQty,
      requiredQuantity: displayReqQty,
      requiredUnit: displayReqUnit,
      unit: displayBuyUnit,
      priceLabel,
      estCost,
      storeType: getStoreTypeForAisle(cat?.aisle ?? 'other', isUS),
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

const US_STORES: Record<string, string> = {
  vegetables: 'Produce / Farmers Market',
  herbs: 'Produce / Farmers Market',
  dairy: 'Dairy Department',
  spices: 'Baking & Spice Aisle',
  grains: 'Pantry & Grains',
  pulses: 'Pantry & Grains',
};

const IN_STORES: Record<string, string> = {
  vegetables: 'Sabzi Mandi / Veg Vendor',
  herbs: 'Sabzi Mandi / Veg Vendor',
  dairy: 'Dairy / Milk Booth',
  spices: 'Spice Merchant / Kirana',
  grains: 'Grocery Wholesale / Retail',
  pulses: 'Grocery Wholesale / Retail',
};

export function getStoreTypeForAisle(aisle: string, isUS = false): string {
  const map = isUS ? US_STORES : IN_STORES;
  return map[aisle] ?? (isUS ? 'Supermarket Grocery' : 'General Store');
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
  currency: string = 'INR',
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
        false,
        currency,
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
      currency,
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
