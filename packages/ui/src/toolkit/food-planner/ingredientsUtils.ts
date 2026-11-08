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
};

const INGREDIENT_THUMBS: Record<string, string> = {
  'basmati-rice': '/food/recipes/jeera-rice.jpg',
  'toor-dal': '/food/recipes/dal-tadka.jpg',
  potato: '/food/recipes/aloo-gobi.jpg',
  cauliflower: '/food/recipes/aloo-gobi.jpg',
  besan: '/food/recipes/besan-ladoo.jpg',
  sugar: '/food/recipes/besan-ladoo.jpg',
  maida: '/food/recipes/mathri.jpg',
  paneer: '/food/recipes/shahi-paneer.jpg',
  'curd-yogurt': '/food/recipes/raita.jpg',
  tomato: '/food/recipes/mixed-veg-salad.jpg',
  onion: '/food/recipes/mixed-veg-salad.jpg',
  'coriander-leaves': '/food/recipes/mixed-veg-salad.jpg',
  ghee: '/food/recipes/besan-ladoo.jpg',
  'cooking-oil': '/food/recipes/besan-ladoo.jpg',
};

export function getPrepForm(id: string): string {
  return PREP_FORMS[id] ?? 'Ground Powder';
}

export function getIngredientThumbnail(id: string): string {
  return INGREDIENT_THUMBS[id] ?? '/food/recipes/dal-tadka.jpg';
}

function normalizeUnit(quantity: string, unit: string) {
  let amount = Number.parseFloat(quantity) || 0;
  let baseUnit = unit;
  if (unit === 'kg') {
    amount *= 1000;
    baseUnit = 'g';
  } else if (unit === 'l') {
    amount *= 1000;
    baseUnit = 'ml';
  } else if (unit === 'tbsp') {
    amount *= 15;
    baseUnit = 'ml';
  } else if (unit === 'tsp') {
    amount *= 5;
    baseUnit = 'ml';
  } else if (unit === 'cup') {
    amount *= 250;
    baseUnit = 'ml';
  }
  return { amount, baseUnit };
}

function fallbackIngredientLines(
  selectedRecipes: ExtendedFoodRecipe[],
  guests: number,
  servingsPerGuest: number,
  catalogMap: Map<string, (typeof CATALOG_INGREDIENTS)[number]>,
): IngredientLineItem[] {
  const agg = new Map<string, { total: number; baseUnit: string; usedIn: Set<string> }>();
  for (const recipe of selectedRecipes) {
    const factor = (guests * servingsPerGuest) / recipe.servings;
    for (const ing of recipe.ingredients) {
      const { amount, baseUnit } = normalizeUnit(ing.quantity, ing.unit);
      const entry = agg.get(ing.ingredient) ?? { total: 0, baseUnit, usedIn: new Set() };
      entry.total += amount * factor;
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
      quantity: formatDisplayQty(data.total, data.baseUnit),
      unit: formatDisplayUnit(data.total, data.baseUnit),
      usedIn: Array.from(data.usedIn),
      allergens: cat?.allergens ?? [],
      prepForm: getPrepForm(ingId),
      thumbnailUrl: getIngredientThumbnail(ingId),
    };
  });
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
    return fallbackIngredientLines(selectedRecipes, guests, servingsPerGuest, catalogMap);
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
  if (aisle === 'vegetables' || aisle === 'herbs') return '#22c55e';
  if (aisle === 'dairy') return '#0284c7';
  if (aisle === 'spices') return '#ef4444';
  if (aisle === 'grains' || aisle === 'pulses') return '#f59e0b';
  return '#8b5cf6';
}
