import { div, isZero, mul, type RoundingMode, sub } from '@mangotools/engine-numeric';
import {
  type Model,
  type OrderValues,
  type ScopedAmount,
  sellerCostNames,
  type Withholding,
} from './model.ts';
import { money, percentOf, sumMoney } from './order.ts';
import type { FeeResult } from './schema.ts';

/** TASK-008L steps 5 and 6: seller costs, adjustments, settlement lines and the results. */
export interface Totals {
  marketplaceFeesTotal: string;
  marketplaceFeeGstTotal: string;
  recoverableMarketplaceFeeGst: string;
  nonRecoverableMarketplaceFeeGst: string;
  sellerControlledCostsTotal: string;
  scenarioEconomicCosts: string;
  scenarioEconomicCredits: string;
  scenarioSettlementDeductions: string;
  scenarioSettlementCredits: string;
  tcsAmount: string;
  tdsAmount: string;
  otherSettlementDeductionsApplied: string;
  settlementCreditsApplied: string;
  totalSettlementDeductions: string;
  estimatedSettlement: string;
  totalEconomicInvestment: string;
  economicProfit: string;
  profitMarginPercent: string | null;
  roiPercent: string | null;
  effectiveMarketplaceFeePercent: string | null;
}

type Parts = Omit<
  Totals,
  | 'totalSettlementDeductions'
  | 'estimatedSettlement'
  | 'totalEconomicInvestment'
  | 'economicProfit'
  | 'profitMarginPercent'
  | 'roiPercent'
  | 'effectiveMarketplaceFeePercent'
>;

function scoped(item: ScopedAmount | undefined, model: Model): string {
  return item?.scenarios.includes(model.scenario) ? item.amount : '0';
}

function withheld(
  item: Withholding | undefined,
  model: Model,
  values: OrderValues,
  rounding: RoundingMode,
): string {
  if (!item?.scenarios.includes(model.scenario)) return '0.00';
  if (item.mode === 'fixed') return money(item.value, rounding);
  const base =
    item.percentageBase === 'customer-invoice-value'
      ? values.customerInvoiceValue
      : values.taxExclusiveRevenue;
  return percentOf(base, item.value, rounding);
}

function adjustmentTotal(
  model: Model,
  direction: 'charge' | 'credit',
  effect: 'economic' | 'settlement',
  rounding: RoundingMode,
): string {
  const amounts = model.adjustments
    .filter((a) => a.direction === direction && a[effect] && a.scenarios.includes(model.scenario))
    .map((a) => a.amount);
  return sumMoney(amounts, rounding);
}

function gstTotal(
  fees: readonly FeeResult[],
  treatment: FeeResult['gstTreatment'] | null,
  rounding: RoundingMode,
): string {
  const selected = fees.filter((f) => treatment === null || f.gstTreatment === treatment);
  return sumMoney(
    selected.map((f) => f.gstAmount),
    rounding,
  );
}

function parts(
  model: Model,
  values: OrderValues,
  fees: readonly FeeResult[],
  rounding: RoundingMode,
): Parts {
  return {
    marketplaceFeesTotal: sumMoney(
      fees.map((f) => f.amount),
      rounding,
    ),
    marketplaceFeeGstTotal: gstTotal(fees, null, rounding),
    recoverableMarketplaceFeeGst: gstTotal(fees, 'recoverable', rounding),
    nonRecoverableMarketplaceFeeGst: gstTotal(fees, 'non-recoverable', rounding),
    sellerControlledCostsTotal: sumMoney(
      sellerCostNames.map((name) => scoped(model.sellerCosts[name], model)),
      rounding,
    ),
    scenarioEconomicCosts: adjustmentTotal(model, 'charge', 'economic', rounding),
    scenarioEconomicCredits: adjustmentTotal(model, 'credit', 'economic', rounding),
    scenarioSettlementDeductions: adjustmentTotal(model, 'charge', 'settlement', rounding),
    scenarioSettlementCredits: adjustmentTotal(model, 'credit', 'settlement', rounding),
    tcsAmount: withheld(model.tcs, model, values, rounding),
    tdsAmount: withheld(model.tds, model, values, rounding),
    otherSettlementDeductionsApplied: money(
      scoped(model.otherSettlementDeductions, model),
      rounding,
    ),
    settlementCreditsApplied: money(scoped(model.settlementCredits, model), rounding),
  };
}

/** `numerator / denominator × 100` to 2 decimals, or null when the denominator is zero. */
export function percentage(
  numerator: string,
  denominator: string,
  rounding: RoundingMode,
): string | null {
  return isZero(denominator) ? null : money(mul(div(numerator, denominator), '100'), rounding);
}

export function computeTotals(
  model: Model,
  values: OrderValues,
  fees: readonly FeeResult[],
  rounding: RoundingMode,
): Totals {
  const p = parts(model, values, fees, rounding);
  const totalSettlementDeductions = sumMoney(
    [
      p.marketplaceFeesTotal,
      p.marketplaceFeeGstTotal,
      p.tcsAmount,
      p.tdsAmount,
      p.otherSettlementDeductionsApplied,
      p.scenarioSettlementDeductions,
    ],
    rounding,
  );
  const estimatedSettlement = sumMoney(
    [
      sub(values.invoiceValueSettled, totalSettlementDeductions),
      p.settlementCreditsApplied,
      p.scenarioSettlementCredits,
    ],
    rounding,
  );
  const totalEconomicInvestment = sumMoney(
    [
      values.productCostRecognised,
      p.marketplaceFeesTotal,
      p.nonRecoverableMarketplaceFeeGst,
      p.sellerControlledCostsTotal,
      p.scenarioEconomicCosts,
    ],
    rounding,
  );
  const economicProfit = sumMoney(
    [sub(values.revenueRecognised, totalEconomicInvestment), p.scenarioEconomicCredits],
    rounding,
  );
  const feeBurden = sumMoney([p.marketplaceFeesTotal, p.nonRecoverableMarketplaceFeeGst], rounding);
  return {
    ...p,
    totalSettlementDeductions,
    estimatedSettlement,
    totalEconomicInvestment,
    economicProfit,
    profitMarginPercent: percentage(economicProfit, values.revenueRecognised, rounding),
    roiPercent: percentage(economicProfit, totalEconomicInvestment, rounding),
    effectiveMarketplaceFeePercent: percentage(feeBurden, values.taxExclusiveRevenue, rounding),
  };
}
