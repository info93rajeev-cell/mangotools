/** Seller profitability maths: pure functions, no UI state. */

export type SellerPricingMode = 'single' | 'compare' | 'targets';
export type SellerInputTab = 'pricing' | 'fulfillment' | 'marketplace_gst' | 'returns';

export interface SellerProfitabilityParams {
  sellingPrice: number;
  productCost: number;
  packagingCost?: number;
  shippingCost?: number;
  warehousingCost?: number;
  labourCost?: number;
  overheadCost?: number;
  commissionPercent?: number;
  closingFee?: number;
  adCost?: number;
  otherCharges?: number;
  gstRate?: number;
  isGstInclusive?: boolean;
  marketplaceFeeGstRate?: number;
  returnRate?: number;
  reverseShipping?: number;
  damagedLossPercent?: number;
  monthlyQty?: number;
}

export interface SellerProfitabilityCalculation {
  directFulfillment: number;
  commissionAmount: number;
  totalMarketplaceFees: number;
  marketplaceFeeGst: number;
  outputGst: number;
  netBaseRevenue: number;
  rtoLossPerUnit: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  markupOnCost: number;
  cashSettlementPayout: number;
  monthlyProfit: number;
  monthlyRevenue: number;
  breakEvenPrice: number;
  costPct: number;
  fulfillmentPct: number;
  feesPct: number;
  profitPct: number;
}

interface CostBreakdown {
  directFulfillment: number;
  commissionAmount: number;
  totalMarketplaceFees: number;
  marketplaceFeeGst: number;
  outputGst: number;
  netBaseRevenue: number;
  rtoLossPerUnit: number;
  totalExpenses: number;
}

function resolveSellerParams(p: SellerProfitabilityParams) {
  const {
    sellingPrice = 0,
    productCost = 0,
    packagingCost = 0,
    shippingCost = 0,
    warehousingCost = 0,
    labourCost = 0,
    overheadCost = 0,
    commissionPercent = 0,
    closingFee = 0,
    adCost = 0,
    otherCharges = 0,
    gstRate = 18,
    isGstInclusive = true,
    marketplaceFeeGstRate = 0,
    returnRate = 0,
    reverseShipping = 0,
    damagedLossPercent = 0,
  } = p;
  return {
    sp: sellingPrice,
    cost: productCost,
    pack: packagingCost,
    ship: shippingCost,
    wh: warehousingCost,
    lab: labourCost,
    ovh: overheadCost,
    commPct: commissionPercent,
    closing: closingFee,
    ad: adCost,
    other: otherCharges,
    gstRate,
    isInc: isGstInclusive,
    feeGstRate: marketplaceFeeGstRate,
    retRate: returnRate,
    revShip: reverseShipping,
    dmgPct: damagedLossPercent,
  };
}

function computeSellerCosts(params: SellerProfitabilityParams): CostBreakdown {
  const p = resolveSellerParams(params);

  const directFulfillment = p.pack + p.ship + p.wh + p.lab + p.ovh;
  const commissionAmount = (p.sp * p.commPct) / 100;
  const totalMarketplaceFees = commissionAmount + p.closing;
  const marketplaceFeeGst = (totalMarketplaceFees * p.feeGstRate) / 100;
  const outputGst = p.isInc ? (p.sp * p.gstRate) / (100 + p.gstRate) : (p.sp * p.gstRate) / 100;
  const netBaseRevenue = p.isInc ? p.sp - outputGst : p.sp;
  const rtoLossPerUnit = (p.retRate / 100) * (p.revShip + p.cost * (p.dmgPct / 100));
  const totalExpenses =
    p.cost +
    directFulfillment +
    totalMarketplaceFees +
    marketplaceFeeGst +
    p.ad +
    p.other +
    rtoLossPerUnit;

  return {
    directFulfillment,
    commissionAmount,
    totalMarketplaceFees,
    marketplaceFeeGst,
    outputGst,
    netBaseRevenue,
    rtoLossPerUnit,
    totalExpenses,
  };
}

/** GST TCS (s.52 CGST Act, 0.5%) + income-tax TDS (s.194-O, 0.1%) withheld by the marketplace. */
export const MARKETPLACE_WITHHOLDING_PERCENT = 0.6;

/** Profit per sale: GST collected inside the price is the government's, so it is not revenue. */
function profitFor(params: SellerProfitabilityParams): number {
  const costs = computeSellerCosts(params);
  return costs.netBaseRevenue - costs.totalExpenses;
}

/**
 * The selling price at which profit is exactly zero, found with the same profit function the
 * result uses (so commission, fee GST and GST inside the price are all included).
 */
function breakEvenFor(params: SellerProfitabilityParams): number {
  let lo = 0;
  let hi = Math.max(1, params.sellingPrice || 0);
  for (let i = 0; i < 60 && profitFor({ ...params, sellingPrice: hi }) < 0; i++) hi *= 2;
  if (profitFor({ ...params, sellingPrice: hi }) < 0) return Number.NaN;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (profitFor({ ...params, sellingPrice: mid }) < 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

export function calculateSellerProfitability(
  params: SellerProfitabilityParams,
): SellerProfitabilityCalculation {
  const sp = params.sellingPrice || 0;
  const cost = params.productCost || 0;
  const qty = params.monthlyQty || 1;
  const ship = params.shippingCost || 0;
  const costs = computeSellerCosts(params);

  const netProfit = costs.netBaseRevenue - costs.totalExpenses;
  const netMargin = costs.netBaseRevenue > 0 ? (netProfit / costs.netBaseRevenue) * 100 : 0;
  const markupOnCost = cost > 0 ? (netProfit / cost) * 100 : 0;
  const withholding = (costs.netBaseRevenue * MARKETPLACE_WITHHOLDING_PERCENT) / 100;
  const cashPayout = Math.max(
    0,
    sp - costs.totalMarketplaceFees - costs.marketplaceFeeGst - withholding - ship,
  );
  const breakEvenPrice = breakEvenFor(params);

  const safeSale = sp > 0 ? sp : 1;
  const costPct = Math.max(0, Math.round((cost / safeSale) * 100));
  const fulfillmentPct = Math.max(0, Math.round((costs.directFulfillment / safeSale) * 100));
  const otherFees = costs.totalExpenses - cost - costs.directFulfillment;
  const feesPct = Math.max(0, Math.round((otherFees / safeSale) * 100));
  const profitPct = Math.max(0, Math.round((netProfit / safeSale) * 100));

  return {
    directFulfillment: r2(costs.directFulfillment),
    commissionAmount: r2(costs.commissionAmount),
    totalMarketplaceFees: r2(costs.totalMarketplaceFees),
    marketplaceFeeGst: r2(costs.marketplaceFeeGst),
    outputGst: r2(costs.outputGst),
    netBaseRevenue: r2(costs.netBaseRevenue),
    rtoLossPerUnit: r2(costs.rtoLossPerUnit),
    totalExpenses: r2(costs.totalExpenses),
    netProfit: r2(netProfit),
    netMargin: Math.round(netMargin * 10) / 10,
    markupOnCost: Math.round(markupOnCost * 10) / 10,
    cashSettlementPayout: r2(cashPayout),
    monthlyProfit: Math.round(netProfit * qty),
    monthlyRevenue: Math.round(sp * qty),
    breakEvenPrice: r2(breakEvenPrice),
    costPct,
    fulfillmentPct,
    feesPct,
    profitPct,
  };
}
