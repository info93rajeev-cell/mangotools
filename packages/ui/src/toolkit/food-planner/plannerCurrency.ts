export type SupportedCurrency = 'INR' | 'USD';

export interface OtherExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: 'fuel' | 'service' | 'packaging' | 'misc';
}

export function getCurrencyForCountry(country?: string): SupportedCurrency {
  if (country === 'US' || country === 'United States') {
    return 'USD';
  }
  return 'INR';
}

export function getCurrencySymbol(currency: SupportedCurrency): string {
  return currency === 'USD' ? '$' : '₹';
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'INR',
  options?: { showDecimals?: boolean },
): string {
  const symbol = getCurrencySymbol(currency);
  const rounded = options?.showDecimals
    ? amount.toFixed(2)
    : Math.round(amount).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN');
  return `${symbol}${rounded}`;
}

export function getDefaultOtherExpenses(currency: SupportedCurrency): OtherExpenseItem[] {
  if (currency === 'USD') {
    return [
      { id: 'fuel', name: 'Cooking Fuel & Sterno Cans', amount: 15, category: 'fuel' },
      { id: 'tableware', name: 'Compostable Plates & Cutlery', amount: 25, category: 'service' },
      { id: 'ice-beverage', name: 'Party Ice & Beverage Tubs', amount: 18, category: 'packaging' },
      { id: 'foil-wraps', name: 'Aluminum Foil & Food Wraps', amount: 12, category: 'misc' },
    ];
  }
  return [
    { id: 'gas-fuel', name: 'Cooking Gas (LPG cylinder ref.)', amount: 100, category: 'fuel' },
    {
      id: 'disposable-plates',
      name: 'Biodegradable Plates & Spoons',
      amount: 80,
      category: 'service',
    },
    {
      id: 'fresh-garnishes',
      name: 'Extra Mint, Coriander & Lemons',
      amount: 120,
      category: 'packaging',
    },
    { id: 'miscellaneous', name: 'Paper Napkins & Food Wrap', amount: 78, category: 'misc' },
  ];
}
