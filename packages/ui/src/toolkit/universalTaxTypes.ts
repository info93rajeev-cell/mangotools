export type CountryCode = 'in' | 'us' | 'uk' | 'ae' | 'au' | 'ca' | 'custom';
export type TaxSystemType = 'gst' | 'vat' | 'sales_tax' | 'custom_slabs';
export type PriceMode = 'exclusive' | 'inclusive';
export type SupplyType = 'intra' | 'inter';
export type DiscountType = 'currency' | 'percent';

export interface TaxSlab {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  rate: number;
  taxType: string;
  notes: string;
}

export interface CountryProfile {
  id: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  defaultTaxSystem: TaxSystemType;
  defaultRate: number;
  rates: number[];
  subdivisions?: { name: string; rate: number; localAvg?: number }[];
}

export const COUNTRIES: CountryProfile[] = [
  {
    id: 'in',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    defaultTaxSystem: 'gst',
    defaultRate: 18,
    rates: [0, 0.25, 3, 5, 18, 40],
  },
  {
    id: 'us',
    name: 'USA',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    defaultTaxSystem: 'sales_tax',
    defaultRate: 7.25,
    rates: [0, 4, 6, 7.25, 8.875, 10],
    subdivisions: [
      { name: 'California', rate: 7.25, localAvg: 1.6 },
      { name: 'New York', rate: 4.0, localAvg: 4.5 },
      { name: 'Texas', rate: 6.25, localAvg: 1.9 },
      { name: 'Florida', rate: 6.0, localAvg: 1.0 },
      { name: 'Washington', rate: 6.5, localAvg: 2.7 },
      { name: 'Illinois', rate: 6.25, localAvg: 2.5 },
      { name: 'Pennsylvania', rate: 6.0, localAvg: 0.3 },
      { name: 'Ohio', rate: 5.75, localAvg: 1.5 },
      { name: 'Georgia', rate: 4.0, localAvg: 3.3 },
      { name: 'North Carolina', rate: 4.75, localAvg: 2.2 },
      { name: 'Oregon (0%)', rate: 0.0, localAvg: 0 },
      { name: 'New Hampshire (0%)', rate: 0.0, localAvg: 0 },
      { name: 'Delaware (0%)', rate: 0.0, localAvg: 0 },
      { name: 'Montana (0%)', rate: 0.0, localAvg: 0 },
      { name: 'Alaska (0%)', rate: 0.0, localAvg: 1.8 },
    ],
  },
  {
    id: 'uk',
    name: 'UK',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    defaultTaxSystem: 'vat',
    defaultRate: 20,
    rates: [0, 5, 20],
  },
  {
    id: 'ae',
    name: 'UAE',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    defaultTaxSystem: 'vat',
    defaultRate: 5,
    rates: [0, 5],
  },
  {
    id: 'au',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    defaultTaxSystem: 'gst',
    defaultRate: 10,
    rates: [0, 10],
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
    defaultTaxSystem: 'sales_tax',
    defaultRate: 13,
    rates: [5, 12, 13, 14.975, 15],
    subdivisions: [
      { name: 'Ontario (HST 13%)', rate: 13.0 },
      { name: 'British Columbia (GST 5% + PST 7%)', rate: 12.0 },
      { name: 'Quebec (GST 5% + QST 9.975%)', rate: 14.975 },
      { name: 'Alberta (GST 5%)', rate: 5.0 },
      { name: 'Nova Scotia (HST 15%)', rate: 15.0 },
      { name: 'New Brunswick (HST 15%)', rate: 15.0 },
      { name: 'Manitoba (GST 5% + PST 7%)', rate: 12.0 },
      { name: 'Saskatchewan (GST 5% + PST 6%)', rate: 11.0 },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Country',
    flag: '🌐',
    currency: 'USD',
    currencySymbol: '$',
    defaultTaxSystem: 'custom_slabs',
    defaultRate: 15,
    rates: [5, 10, 15, 20, 25],
  },
];

export const DEFAULT_TAX_SLABS: TaxSlab[] = [
  { id: 'slab-1', minAmount: 0, maxAmount: 50000, rate: 5, taxType: 'VAT', notes: 'Standard rate' },
  {
    id: 'slab-2',
    minAmount: 50001,
    maxAmount: 200000,
    rate: 12,
    taxType: 'VAT',
    notes: 'Mid tier',
  },
  {
    id: 'slab-3',
    minAmount: 200001,
    maxAmount: null,
    rate: 18,
    taxType: 'VAT',
    notes: 'Higher tier',
  },
];

export interface TaxComponentBreakdown {
  name: string;
  rate: number;
  amount: number;
  percentage: number;
  color: string;
}

export interface UniversalTaxCalculationResult {
  currencySymbol: string;
  rawSubtotal: number;
  discountAmount: number;
  shippingCharges: number;
  taxableAmount: number;
  totalTax: number;
  finalAmount: number;
  effectiveRate: number;
  components: TaxComponentBreakdown[];
  savings: number;
  formulaNote: string;
}

export interface UniversalTaxInputParams {
  country: CountryCode;
  taxSystem: TaxSystemType;
  priceMode: PriceMode;
  amount: number;
  quantity: number;
  discountType: DiscountType;
  discountValue: number;
  shippingCharges: number;
  supplyType: SupplyType;
  gstRate: number;
  cessRate: number;
  isComposition: boolean;
  selectedStateIndex: number;
  localTaxRate: number;
  taxSlabs: TaxSlab[];
}
