export type DietaryOption = 'all' | 'veg' | 'non-veg' | 'vegan' | 'jain';

export function matchesDietaryFilter(
  recipeDiet: string,
  activeDiet: DietaryOption = 'all',
): boolean {
  if (activeDiet === 'all') return true;
  if (activeDiet === 'veg') {
    return recipeDiet === 'vegetarian' || recipeDiet === 'vegan' || recipeDiet === 'jain';
  }
  if (activeDiet === 'non-veg') {
    return recipeDiet === 'non-vegetarian' || recipeDiet === 'eggetarian';
  }
  if (activeDiet === 'vegan') {
    return recipeDiet === 'vegan';
  }
  if (activeDiet === 'jain') {
    return recipeDiet === 'jain';
  }
  return true;
}
