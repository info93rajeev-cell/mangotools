import { CATALOG_INGREDIENTS, type ExtendedFoodRecipe } from './foodReferenceData.ts';

export interface IngredientLineItem {
  id: string;
  name: string;
  aisle: string;
  quantity: string;
  unit: string;
  usedIn: string[];
  allergens: string[];
  prepForm?: string;
  thumbnailUrl?: string;
}

const PREP_FORMS: Record<string, string> = {
  'basmati-rice': 'Wash & Soak',
  'toor-dal': 'Pressure Boil',
  besan: 'Sieve & Roast',
  maida: 'Sieve & Knead',
  sugar: 'Tagar / Powder',
  ghee: 'Melt',
  'cooking-oil': 'Warm Oil',
  paneer: 'Cube 1-inch',
  'curd-yogurt': 'Whisk Smooth',
  potato: 'Dice & Boil',
  cauliflower: 'Florets',
  tomato: 'Finely Dice',
  onion: 'Thin Slice',
  garlic: 'Fine Mince',
  'ginger-garlic-paste': 'Fine Mince',
  'coriander-leaves': 'Wash & Chop',
  'cumin-seeds': 'Whole Temper',
  cashew: 'Grind / Halve',
  'green-cardamom': 'Fresh Crush',
  'ground-cardamom': 'Fine Powder',
  'whole-milk': 'Boil & Cool',
  'whole-milk-powder': 'Sift Lump-Free',
  'baking-soda': 'Exact Pinch',
  lemon: 'Fresh Juice',
};

export function getPrepForm(id: string): string {
  return PREP_FORMS[id] ?? 'Ground Powder';
}

export function getIngredientThumbnail(id: string): string {
  return `/food/ingredients/${id}.svg`;
}

export function extractIngredientLines(
  engineConsolidated: unknown,
  selectedRecipes: ExtendedFoodRecipe[],
  _guests: number,
  _servingsPerGuest: number,
): IngredientLineItem[] {
  const cons = engineConsolidated as {
    lines?: Array<{ ingredient: string; total: string; buy: string; unit: string }>;
  } | null;

  const catalogMap = new Map(CATALOG_INGREDIENTS.map((i) => [i.id, i]));

  if (!cons?.lines) {
    return [];
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
      prepForm: getPrepForm(l.ingredient),
      thumbnailUrl: getIngredientThumbnail(l.ingredient),
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
  if (aisle === 'vegetables' || aisle === 'herbs') return '#166534';
  if (aisle === 'dairy') return '#075985';
  if (aisle === 'spices') return '#b91c1c';
  if (aisle === 'grains' || aisle === 'pulses') return '#92400e';
  return '#6d28d9';
}
