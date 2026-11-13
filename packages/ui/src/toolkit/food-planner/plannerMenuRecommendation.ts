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

function getUSPreset(
  eligible: ExtendedFoodRecipe[],
  mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (mealType === 'breakfast' || occ.includes('brunch')) {
    return findRecipesByIds(eligible, [
      'classic-pancakes',
      'fresh-lemonade',
      'chocolate-chip-cookies',
    ]);
  }
  if (
    occ.includes('bbq') ||
    occ.includes('4th') ||
    occ.includes('super bowl') ||
    occ.includes('game day')
  ) {
    return findRecipesByIds(eligible, [
      'bbq-pulled-chicken',
      'buffalo-wings',
      'black-bean-burger',
      'creamy-coleslaw',
      'chocolate-chip-cookies',
      'fresh-lemonade',
    ]);
  }
  if (occ.includes('thanksgiving') || occ.includes('christmas') || occ.includes('holiday')) {
    return findRecipesByIds(eligible, [
      'bbq-pulled-chicken',
      'mac-and-cheese',
      'mashed-potatoes',
      'skillet-cornbread',
      'caesar-salad',
      'apple-pie',
    ]);
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
const IN_SOUTH_INDIAN = [
  'masala-dosa',
  'idli-sambar',
  'medu-vada',
  'hyderabadi-biryani',
  'boondi-raita',
  'kheer',
];
const IN_WEDDING = [
  'hyderabadi-biryani',
  'shahi-paneer',
  'dal-tadka',
  'paneer-tikka',
  'kaju-katli',
  'gulab-jamun',
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
  if (occ.includes('south') || occ.includes('pongal') || occ.includes('onam')) {
    return findRecipesByIds(eligible, IN_SOUTH_INDIAN);
  }
  if (occ.includes('wedding') || occ.includes('shaadi')) {
    return findRecipesByIds(eligible, IN_WEDDING);
  }
  if (occ.includes('festival') || occ.includes('diwali') || occ.includes('puja')) {
    return findRecipesByIds(eligible, IN_FESTIVAL);
  }
  return findRecipesByIds(eligible, IN_DINNER);
}

function getEuropePreset(
  eligible: ExtendedFoodRecipe[],
  _mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (occ.includes('christmas') || occ.includes('vigilia') || occ.includes('reveillon')) {
    return findRecipesByIds(eligible, [
      'margherita-pizza',
      'veggie-lasagna',
      'minestrone-soup',
      'caprese-salad',
      'classic-tiramisu',
    ]);
  }
  if (occ.includes('tapas') || occ.includes('garden')) {
    return findRecipesByIds(eligible, [
      'bruschetta-pomodoro',
      'spanish-paella',
      'caprese-salad',
      'panna-cotta',
    ]);
  }
  if (occ.includes('pranzo') || occ.includes('family')) {
    return findRecipesByIds(eligible, [
      'greek-moussaka',
      'veggie-lasagna',
      'caprese-salad',
      'classic-tiramisu',
    ]);
  }
  return findRecipesByIds(eligible, [
    'margherita-pizza',
    'spanish-paella',
    'penne-arrabbiata',
    'minestrone-soup',
    'classic-tiramisu',
  ]);
}

function getPanAsianPreset(
  eligible: ExtendedFoodRecipe[],
  mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (occ.includes('dim sum') || occ.includes('tea') || mealType === 'breakfast') {
    return findRecipesByIds(eligible, [
      'steamed-dim-sum',
      'vegetable-gyoza',
      'spring-rolls',
      'bubble-tea',
    ]);
  }
  if (occ.includes('street') || occ.includes('night market')) {
    return findRecipesByIds(eligible, [
      'pad-thai',
      'vegetable-gyoza',
      'spring-rolls',
      'bubble-tea',
      'mango-sticky-rice',
    ]);
  }
  return findRecipesByIds(eligible, [
    'pad-thai',
    'veg-fried-rice',
    'thai-green-curry',
    'tom-yum-soup',
    'mango-sticky-rice',
  ]);
}

function getMiddleEastPreset(
  eligible: ExtendedFoodRecipe[],
  _mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (occ.includes('eid') || occ.includes('adha') || occ.includes('fitr')) {
    return findRecipesByIds(eligible, [
      'mandi-rice',
      'falafel-platter',
      'hummus-pita',
      'tabbouleh',
      'baba-ganoush',
      'baklava',
    ]);
  }
  if (occ.includes('mezze') || occ.includes('grill') || occ.includes('friday')) {
    return findRecipesByIds(eligible, [
      'hummus-pita',
      'baba-ganoush',
      'falafel-platter',
      'tabbouleh',
      'baklava',
      'mint-lemonade',
    ]);
  }
  if (occ.includes('iftar') || occ.includes('ramadan')) {
    return findRecipesByIds(eligible, [
      'lentil-soup-shorba',
      'mandi-rice',
      'shakshuka',
      'hummus-pita',
      'baklava',
      'mint-lemonade',
    ]);
  }
  return findRecipesByIds(eligible, [
    'mandi-rice',
    'falafel-platter',
    'shawarma-wrap',
    'baba-ganoush',
    'tabbouleh',
    'baklava',
  ]);
}

function getLatinAmericaPreset(
  eligible: ExtendedFoodRecipe[],
  _mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  const occ = (occasion ?? '').toLowerCase();
  if (occ.includes('taco') || occ.includes('street')) {
    return findRecipesByIds(eligible, [
      'street-tacos',
      'loaded-nachos',
      'mexican-street-corn',
      'guacamole-chips',
      'agua-de-horchata',
    ]);
  }
  if (occ.includes('asado') || occ.includes('barbacoa')) {
    return findRecipesByIds(eligible, [
      'sizzling-fajitas',
      'chiles-rellenos',
      'mexican-street-corn',
      'loaded-nachos',
      'churros',
    ]);
  }
  return findRecipesByIds(eligible, [
    'chiles-rellenos',
    'street-tacos',
    'enchiladas-suizas',
    'tres-leches-cake',
    'agua-de-horchata',
  ]);
}

function getRegionalPreset(
  regionId: CulinaryRegionId,
  eligible: ExtendedFoodRecipe[],
  mealType?: string,
  occasion?: string,
): ExtendedFoodRecipe[] {
  if (regionId === 'europe-med') return getEuropePreset(eligible, mealType, occasion);
  if (regionId === 'east-pan-asian') return getPanAsianPreset(eligible, mealType, occasion);
  if (regionId === 'middle-east') return getMiddleEastPreset(eligible, mealType, occasion);
  if (regionId === 'latin-america') return getLatinAmericaPreset(eligible, mealType, occasion);
  if (regionId === 'north-america') return getUSPreset(eligible, mealType, occasion);
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

function getCourseFallback(eligible: ExtendedFoodRecipe[]): ExtendedFoodRecipe[] {
  const courses: Array<ExtendedFoodRecipe['course']> = ['snack', 'main', 'side', 'dessert'];
  const result: ExtendedFoodRecipe[] = [];
  for (const c of courses) {
    const item = eligible.find((r) => r.course === c && !result.some((p) => p.id === r.id));
    if (item) result.push(item);
  }
  return result.length > 0 ? result : eligible.slice(0, 4);
}

function findRecipesByIds(list: ExtendedFoodRecipe[], ids: string[]): ExtendedFoodRecipe[] {
  const result: ExtendedFoodRecipe[] = [];
  for (const id of ids) {
    const found = list.find((r) => r.id === id);
    if (found) result.push(found);
  }
  return result;
}
