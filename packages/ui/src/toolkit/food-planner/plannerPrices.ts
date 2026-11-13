import { CATALOG_INGREDIENTS, REFERENCE_PRICES } from './foodReferenceData.ts';
import { REFERENCE_PRICES_US } from './foodReferencePricesUS.ts';

export function priceBasis(
  ingredient: string,
  mode: 'retail' | 'wholesale',
  isUS: boolean = false,
) {
  const list = isUS
    ? ([...REFERENCE_PRICES_US, ...REFERENCE_PRICES] as typeof REFERENCE_PRICES)
    : ([...REFERENCE_PRICES, ...REFERENCE_PRICES_US] as typeof REFERENCE_PRICES);
  const reference = list.find(
    (item) => item.ingredient === ingredient && item.kind === `${mode}-reference`,
  );
  const dimension = CATALOG_INGREDIENTS.find((item) => item.id === ingredient)?.dimension;
  return (
    reference ?? {
      ingredient,
      per: '1',
      unit:
        dimension === 'mass'
          ? isUS
            ? 'lb'
            : 'kg'
          : dimension === 'volume'
            ? isUS
              ? 'fl-oz'
              : 'l'
            : 'piece',
    }
  );
}

export function enteredPrices(
  values: Record<string, string>,
  mode: 'retail' | 'wholesale',
  observedOn: string,
  isUS: boolean = false,
) {
  return Object.entries(values).map(([ingredient, priceInr]) => {
    const basis = priceBasis(ingredient, mode, isUS);
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
