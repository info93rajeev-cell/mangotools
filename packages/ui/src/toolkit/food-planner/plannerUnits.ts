export type UnitSystem = 'metric' | 'us-customary';

export function getUnitSystemForCountry(country?: string): UnitSystem {
  if (country === 'US' || country === 'United States') {
    return 'us-customary';
  }
  return 'metric';
}

export function formatShoppingUnit(
  quantityGramsOrMl: number,
  dimension: 'mass' | 'volume' | 'count',
  unitSystem: UnitSystem,
): { displayQuantity: string; displayUnit: string } {
  if (dimension === 'count') {
    return {
      displayQuantity: Math.ceil(quantityGramsOrMl).toString(),
      displayUnit: 'piece',
    };
  }

  if (unitSystem === 'us-customary') {
    if (dimension === 'mass') {
      const pounds = quantityGramsOrMl / 453.59237;
      if (pounds >= 1) {
        return {
          displayQuantity: (Math.round(pounds * 10) / 10).toFixed(1).replace(/\.0$/, ''),
          displayUnit: 'lb',
        };
      }
      const ounces = quantityGramsOrMl / 28.349523125;
      return {
        displayQuantity: Math.ceil(ounces).toString(),
        displayUnit: 'oz',
      };
    }
    // volume
    const gallons = quantityGramsOrMl / 3785.411784;
    if (gallons >= 1) {
      return {
        displayQuantity: (Math.round(gallons * 10) / 10).toFixed(1).replace(/\.0$/, ''),
        displayUnit: 'gal',
      };
    }
    const fluidOunces = quantityGramsOrMl / 29.5735295625;
    return {
      displayQuantity: Math.ceil(fluidOunces).toString(),
      displayUnit: 'fl oz',
    };
  }

  // Metric
  if (dimension === 'mass') {
    if (quantityGramsOrMl >= 1000) {
      const kg = quantityGramsOrMl / 1000;
      return {
        displayQuantity: (Math.round(kg * 100) / 100).toFixed(2).replace(/\.?0+$/, ''),
        displayUnit: 'kg',
      };
    }
    return {
      displayQuantity: Math.round(quantityGramsOrMl).toString(),
      displayUnit: 'g',
    };
  }

  // Metric volume
  if (quantityGramsOrMl >= 1000) {
    const liters = quantityGramsOrMl / 1000;
    return {
      displayQuantity: (Math.round(liters * 100) / 100).toFixed(2).replace(/\.?0+$/, ''),
      displayUnit: 'L',
    };
  }
  return {
    displayQuantity: Math.round(quantityGramsOrMl).toString(),
    displayUnit: 'ml',
  };
}
