import type { PercentageBase, Scenario } from './schema.ts';

/** Validated, normalised input (decimal strings) used by every calculation step. */

export interface Bounds {
  min?: string;
  max?: string;
}

export interface PriceSlab extends Bounds {
  chargeMode: 'fixed' | 'percent';
  value: string;
}

export interface WeightSlab extends Bounds {
  unit: 'g' | 'kg';
  amount: string;
}

export type GstTreatment = 'none' | 'recoverable' | 'non-recoverable';
export type SlabPriceBase = 'entered-unit-selling-price' | 'realized-unit-selling-price';

export interface FeeLine {
  id: string;
  enabled: boolean;
  mode: 'fixed' | 'percent' | 'price-slabs' | 'weight-slabs';
  amount?: string;
  ratePercent?: string;
  quantityScope?: 'per-unit' | 'per-order';
  percentageBase?: PercentageBase;
  slabPriceBase?: SlabPriceBase;
  priceSlabs: PriceSlab[];
  weightSlabs: WeightSlab[];
  gstTreatment: GstTreatment;
  scenarios: Scenario[];
}

export interface ScopedAmount {
  amount: string;
  scenarios: Scenario[];
}

export interface Withholding {
  mode: 'percent' | 'fixed';
  value: string;
  percentageBase?: 'tax-exclusive-revenue' | 'customer-invoice-value';
  scenarios: Scenario[];
}

export interface Adjustment {
  id: string;
  direction: 'charge' | 'credit';
  amount: string;
  economic: boolean;
  settlement: boolean;
  scenarios: Scenario[];
}

export const sellerCostNames = [
  'packagingCost',
  'sellerShippingCost',
  'advertisingCost',
  'otherTransactionCost',
] as const;
export type SellerCostName = (typeof sellerCostNames)[number];

export interface Order {
  sellingPricePerUnit: string;
  quantity: string;
  productCostPerUnit: string;
  promotionalDiscount: string;
  couponDiscount: string;
  productGstRatePercent: string;
  taxMode: 'gst-inclusive' | 'gst-exclusive';
}

export interface Model {
  order: Order;
  chargeableWeight?: { value: string; unit: 'g' | 'kg' };
  feeLines: FeeLine[];
  marketplaceFeeGstRatePercent?: string;
  sellerCosts: Partial<Record<SellerCostName, ScopedAmount>>;
  tcs?: Withholding;
  tds?: Withholding;
  otherSettlementDeductions?: ScopedAmount;
  settlementCredits?: ScopedAmount;
  scenario: Scenario;
  adjustments: Adjustment[];
}

/** Order values from TASK-008L step 1 plus the scenario-recognised values of step 2. */
export interface OrderValues {
  grossCustomerValue: string;
  sellerFundedReduction: string;
  realizedCustomerValue: string;
  customerInvoiceValue: string;
  orderProductGstAmount: string;
  taxExclusiveRevenue: string;
  productCostTotal: string;
  revenueRecognised: string;
  invoiceValueSettled: string;
  productCostRecognised: string;
  productGstLiabilityRecognised: string;
}

export const MAX_ITEMS = 20;
