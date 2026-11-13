import { type CulinaryRegionId, getCulinaryRegionId } from './foodCulinaryRegions.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export interface MenuRecommendationParams {
  country?: 'IN' | 'US';
  location?: string;
  occasion?: string;
  mealType?: string;
  diet?: string;
  guests?: number;
  availableRecipes: ExtendedFoodRecipe[];
}

function filterByDiet(list: ExtendedFoodRecipe[], diet?: string): ExtendedFoodRecipe[] {
  if (!diet || diet === 'all' || diet === 'none') return list;
  if (diet === 'vegetarian') {
    return list.filter((r) => r.diet === 'vegetarian' || r.diet === 'vegan' || r.diet === 'jain');
  }
  if (diet === 'vegan' || diet === 'jain') {
    return list.filter((r) => r.diet === diet);
  }
  return list;
}

const US_DINNER = [
  'mac-and-cheese',
  'bbq-pulled-chicken',
  'mashed-potatoes',
  'caesar-salad',
  'new-york-cheesecake',
];

const EU_DINNER = [
  'margherita-pizza',
  'penne-arrabbiata',
  'veggie-lasagna',
  'minestrone-soup',
  'mediterranean-salad',
  'classic-tiramisu',
];

const ASIA_DINNER = [
  'veg-fried-rice',
  'hakka-noodles',
  'spring-rolls',
  'thai-green-curry',
  'sweet-corn-soup',
  'mango-sticky-rice',
];

const ME_DINNER = [
  'falafel-platter',
  'hummus-pita',
  'mandi-rice',
  'shawarma-wrap',
  'fattoush-salad',
  'baklava',
];

const LA_DINNER = [
  'street-tacos',
  'cheese-quesadilla',
  'sizzling-fajitas',
  'enchiladas-suizas',
  'guacamole-chips',
  'churros',
];

function getUSPreset(eligible: ExtendedFoodRecipe[], mealType?: string): ExtendedFoodRecipe[] {
  if (mealType === 'breakfast') {
    return findRecipesByIds(eligible, ['classic-pancakes', 'fresh-lemonade']);
  }
  if (mealType === 'lunch') {
    return findRecipesByIds(eligible, [
      'grilled-cheese-sandwich',
      'tomato-basil-soup',
      'creamy-coleslaw',
      'chocolate-chip-cookies',
    ]);
  }
  return findRecipesByIds(eligible, US_DINNER);
}

const IN_TEA = ['samosa', 'mathri', 'masala-chai', 'besan-ladoo', 'idli-sambar', 'medu-vada'];
const IN_FESTIVAL = [
  'jeera-rice',
  'dal-tadka',
  'shahi-paneer',
  'hyderabadi-biryani',
  'gulab-jamun',
  'kaju-katli',
  'kheer',
];
const IN_DINNER = [
  'jeera-rice',
  'dal-tadka',
  'shahi-paneer',
  'aloo-gobi',
  'raita',
  'mixed-veg-salad',
  'gulab-jamun',
];

function getIndiaPreset(
  eligible: ExtendedFoodRecipe[],
  mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (mealType === 'breakfast' || occ.includes('tea')) {
    return findRecipesByIds(eligible, IN_TEA);
  }
  if (occ.includes('festival') || occ.includes('diwali')) {
    return findRecipesByIds(eligible, IN_FESTIVAL);
  }
  return findRecipesByIds(eligible, IN_DINNER);
}

function getCourseFallback(eligible: ExtendedFoodRecipe[]): ExtendedFoodRecipe[] {
  const courses: Array<ExtendedFoodRecipe['course']> = ['snack', 'main', 'side', 'dessert'];
  const result: ExtendedFoodRecipe[] = [];
  for (const c of courses) {
    const item = eligible.find((r) => r.course === c && !result.some((p) => p.id === r.id));
    if (item) result.push(item);
  }
  return result.length > 0 ? result : eligible.slice(0, 4);
}

function getRegionalPreset(
  regionId: CulinaryRegionId,
  eligible: ExtendedFoodRecipe[],
  mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  if (regionId === 'europe-med') return findRecipesByIds(eligible, EU_DINNER);
  if (regionId === 'east-pan-asian') return findRecipesByIds(eligible, ASIA_DINNER);
  if (regionId === 'middle-east') return findRecipesByIds(eligible, ME_DINNER);
  if (regionId === 'latin-america') return findRecipesByIds(eligible, LA_DINNER);
  if (regionId === 'north-america') return getUSPreset(eligible, mealType);
  return getIndiaPreset(eligible, mealType, occasion);
}

export function recommendMenu(params: MenuRecommendationParams): ExtendedFoodRecipe[] {
  const { country, location, occasion, mealType, diet, availableRecipes } = params;
  const regionId = getCulinaryRegionId(location, country);

  const regionFiltered = availableRecipes.filter((r) => {
    if (regionId === 'india-south-asia') return !r.countries || r.countries.includes('IN');
    if (regionId === 'north-america') return Boolean(r.countries?.includes('US'));
    if (regionId === 'europe-med') return Boolean(r.countries?.includes('EU'));
    if (regionId === 'east-pan-asian') return Boolean(r.countries?.includes('ASIA'));
    if (regionId === 'middle-east') return Boolean(r.countries?.includes('ME'));
    if (regionId === 'latin-america') return Boolean(r.countries?.includes('LA'));
    return true;
  });

  const eligible = filterByDiet(regionFiltered, diet);
  const preset = getRegionalPreset(regionId, eligible, mealType, occasion);

  if (preset.length >= 2) return preset;
  return getCourseFallback(eligible);
}

function findRecipesByIds(list: ExtendedFoodRecipe[], ids: string[]): ExtendedFoodRecipe[] {
  const result: ExtendedFoodRecipe[] = [];
  for (const id of ids) {
    const found = list.find((r) => r.id === id);
    if (found) result.push(found);
  }
  return result;
}
