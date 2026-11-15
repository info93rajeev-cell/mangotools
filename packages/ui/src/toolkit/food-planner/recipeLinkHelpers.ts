import type { ExtendedFoodRecipe } from './foodRecipesData.ts';

export const KNOWN_DEAD_PATTERNS = [
  '7bN6vK5m8yA',
  '9jK8mN5vXwA',
  '8vK8mN5vXwA',
  '2r1p0g0Wq7w',
  'mAtAr',
  'FjC2g',
  'FjLw3h3iU',
  'kY8b',
  'rY8b',
  'sY8b',
  'tY8b',
  'gY8b',
  'hY8b',
  'mY8b',
  'fY8b',
  'bY8b',
  'pY8b',
  'cY8b',
  'nY8b',
  'vM8m',
  'vP8m',
  'bijoligrill.com',
  '9wolf',
  'caterspoonmumbai.com',
  '.gov.in',
  '.nic.in',
  '.res.in',
  'fliphtml5.com',
  'cani.edu.in',
  'zomato.com',
  'magicpin.in',
];

export function getSafeRecipeSourceUrl(
  source: { url: string; publisher: string; title: string },
  recipeName: string,
): string {
  const url = source.url || '';
  const urlLower = url.toLowerCase();

  // If link matches known dead patterns or hijacked domains, safely route to Google recipe search
  if (KNOWN_DEAD_PATTERNS.some((p) => urlLower.includes(p.toLowerCase()))) {
    const cleanRecipe = recipeName.replace(/\([^)]*\)/g, '').trim();
    const searchTerms = [source.publisher, source.title, cleanRecipe].filter(Boolean).join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} recipe`)}`;
  }

  if (
    urlLower.startsWith('https://www.youtube.com/') ||
    urlLower.startsWith('https://youtube.com/') ||
    urlLower.startsWith('https://en.wikipedia.org/') ||
    urlLower.startsWith('https://www.google.com/search') ||
    urlLower.startsWith('https://www.vegrecipesofindia.com/') ||
    urlLower.startsWith('https://hebbarskitchen.com/') ||
    urlLower.startsWith('https://www.tarladalal.com/') ||
    urlLower.startsWith('https://www.bongeats.com/') ||
    urlLower.startsWith('https://www.sanjeevkapoor.com/')
  ) {
    return url;
  }

  const cleanRecipe = recipeName.replace(/\([^)]*\)/g, '').trim();
  const searchTerms = [source.publisher, source.title, cleanRecipe].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(`${searchTerms} recipe`)}`;
}

export function getRecipeVideoTutorialUrl(recipe: ExtendedFoodRecipe): string {
  if (recipe.videoUrl?.includes('search_query=')) {
    return recipe.videoUrl;
  }
  const cleanName = recipe.name.replace(/\([^)]*\)/g, '').trim();
  if (
    recipe.videoUrl &&
    /(?:watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(recipe.videoUrl) &&
    !KNOWN_DEAD_PATTERNS.some((p) => recipe.videoUrl?.toLowerCase().includes(p.toLowerCase()))
  ) {
    return recipe.videoUrl;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${cleanName} authentic recipe video tutorial`,
  )}`;
}

export function scaledRecipeQuantity(
  quantity: string,
  unit: string,
  servings: number,
  baseServings: number,
): string {
  const scaled = (Number(quantity) * servings) / baseServings;
  if (!Number.isFinite(scaled) || scaled <= 0) return `${quantity} ${unit}`;
  const displayUnit =
    unit === 'g' && scaled >= 1000 ? 'kg' : unit === 'ml' && scaled >= 1000 ? 'l' : unit;
  const displayValue = displayUnit === unit ? scaled : scaled / 1000;
  return `${Number(displayValue.toFixed(2))} ${displayUnit}`;
}
