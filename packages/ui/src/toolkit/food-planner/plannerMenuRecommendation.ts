import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export interface MenuRecommendationParams {
  country: 'IN' | 'US';
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

const IN_TEA = ['samosa', 'mathri', 'masala-chai', 'besan-ladoo'];
const IN_FESTIVAL = [
  'jeera-rice',
  'dal-tadka',
  'shahi-paneer',
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

export function recommendMenu(params: MenuRecommendationParams): ExtendedFoodRecipe[] {
  const { country, occasion, mealType, diet, availableRecipes } = params;

  const countryFiltered = availableRecipes.filter((r) => {
    if (!r.countries || r.countries.length === 0) return country === 'IN';
    return r.countries.includes(country);
  });

  const eligible = filterByDiet(countryFiltered, diet);
  const preset =
    country === 'US'
      ? getUSPreset(eligible, mealType)
      : getIndiaPreset(eligible, mealType, occasion);

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
