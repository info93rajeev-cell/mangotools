import { CATALOG_INGREDIENTS, REFERENCE_PRICES } from './foodReferenceData.ts';

export function priceBasis(ingredient: string, mode: 'retail' | 'wholesale') {
  const reference = REFERENCE_PRICES.find(
    (item) => item.ingredient === ingredient && item.kind === `${mode}-reference`,
  );
  const dimension = CATALOG_INGREDIENTS.find((item) => item.id === ingredient)?.dimension;
  return (
    reference ?? {
      ingredient,
      per: '1',
      unit: dimension === 'mass' ? 'kg' : dimension === 'volume' ? 'l' : 'piece',
    }
  );
}

export function enteredPrices(
  values: Record<string, string>,
  mode: 'retail' | 'wholesale',
  observedOn: string,
) {
  return Object.entries(values).map(([ingredient, priceInr]) => {
    const basis = priceBasis(ingredient, mode);
    return {
      ingredient,
      priceInr,
      per: basis.per,
      unit: basis.unit,
      kind: 'user-entered' as const,
      observedOn,
    };
  });
}
