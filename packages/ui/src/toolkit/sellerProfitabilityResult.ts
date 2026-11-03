/**
 * The Seller Profitability studio's view of `estimate.seller.unit-economics@1`. The engine does all
 * the maths in exact decimals; this module only turns its decimal strings into numbers for display.
 */

export type SellerPricingMode = 'single' | 'compare' | 'targets';
export type SellerInputTab = 'pricing' | 'fulfillment' | 'marketplace_gst' | 'returns';

export interface SellerProfitabilityCalculation {
  directFulfillment: number;
  commissionAmount: number;
  totalMarketplaceFees: number;
  marketplaceFeeGst: number;
  /** GST inside the price (zero when GST is added on top). */
  outputGst: number;
  netBaseRevenue: number;
  rtoLossPerUnit: number;
  otherCosts: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  /** Null when product cost is zero. */
  markupOnCost: number | null;
  withholding: number;
  cashSettlementPayout: number;
  monthlyProfit: number;
  monthlyRevenue: number;
  /** NaN when no price can break even. */
  breakEvenPrice: number;
  priceForTargetProfit: number;
  priceForTargetMargin: number;
  costPct: number;
  fulfillmentPct: number;
  feesPct: number;
  otherPct: number;
  gstPct: number;
  profitPct: number;
}

const num = (raw: unknown): number => {
  if (typeof raw !== 'string' || raw.trim() === '') return Number.NaN;
  return Number(raw);
};

/** Zeroes until the engine's first result arrives. */
export const EMPTY_SELLER_CALCULATION: SellerProfitabilityCalculation = {
  directFulfillment: 0,
  commissionAmount: 0,
  totalMarketplaceFees: 0,
  marketplaceFeeGst: 0,
  outputGst: 0,
  netBaseRevenue: 0,
  rtoLossPerUnit: 0,
  otherCosts: 0,
  totalExpenses: 0,
  netProfit: 0,
  netMargin: 0,
  markupOnCost: null,
  withholding: 0,
  cashSettlementPayout: 0,
  monthlyProfit: 0,
  monthlyRevenue: 0,
  breakEvenPrice: Number.NaN,
  priceForTargetProfit: Number.NaN,
  priceForTargetMargin: Number.NaN,
  costPct: 0,
  fulfillmentPct: 0,
  feesPct: 0,
  otherPct: 0,
  gstPct: 0,
  profitPct: 0,
};

/** The engine result as display numbers, or the empty calculation when there is none yet. */
export function readSellerCalculation(
  value: Record<string, unknown> | undefined,
): SellerProfitabilityCalculation {
  if (!value) return EMPTY_SELLER_CALCULATION;
  const markup = value.markupPercent;
  return {
    directFulfillment: num(value.directFulfillment),
    commissionAmount: num(value.commissionAmount),
    totalMarketplaceFees: num(value.marketplaceFees),
    marketplaceFeeGst: num(value.marketplaceFeeGst),
    outputGst: num(value.gstInPrice),
    netBaseRevenue: num(value.netRevenue),
    rtoLossPerUnit: num(value.returnLoss),
    otherCosts: num(value.otherCosts),
    totalExpenses: num(value.totalCosts),
    netProfit: num(value.netProfit),
    netMargin: num(value.netMarginPercent),
    markupOnCost: markup === null ? null : num(markup),
    withholding: num(value.withholding),
    cashSettlementPayout: num(value.cashSettlement),
    monthlyProfit: num(value.monthlyProfit),
    monthlyRevenue: num(value.monthlyRevenue),
    breakEvenPrice: num(value.breakEvenPrice),
    priceForTargetProfit: num(value.priceForTargetProfit),
    priceForTargetMargin: num(value.priceForTargetMargin),
    costPct: num(value.productSharePercent),
    fulfillmentPct: num(value.fulfillmentSharePercent),
    feesPct: num(value.feesSharePercent),
    otherPct: num(value.otherSharePercent),
    gstPct: num(value.gstSharePercent),
    profitPct: num(value.profitSharePercent),
  };
}
