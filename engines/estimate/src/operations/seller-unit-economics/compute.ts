import {
  add,
  compare,
  div,
  isZero,
  mul,
  type RoundingMode,
  sub,
  toFixedString,
} from '@mangotools/engine-numeric';
import type { UnitInputs } from './read.ts';
import type { SellerUnitEconomicsOutput } from './schema.ts';

export type UnitValues = Omit<SellerUnitEconomicsOutput, 'working'>;

const sum = (values: string[]) => values.reduce((total, value) => add(total, value), '0');
const pct = (value: string) => div(value, '100');

/** Each line is rounded to paise before it is added, so every shown total reconciles. */
interface Lines {
  net: string;
  gstInPrice: string;
  commission: string;
  fees: string;
  feeGst: string;
  direct: string;
  returnLoss: string;
  other: string;
  total: string;
}

/** Share of revenue that is not GST: 100 ÷ (100 + rate) for a GST-inclusive price, else 1. */
function revenueFactor(v: UnitInputs): string {
  return v.priceIncludesGst ? div('100', add('100', v.gstRatePercent)) : '1';
}

function lines(v: UnitInputs, r: (x: string) => string): Lines {
  const net = r(mul(v.sellingPrice, revenueFactor(v)));
  const commission = r(mul(v.sellingPrice, pct(v.commissionPercent)));
  const fees = sum([commission, v.referralFee, v.closingFee, v.handlingFee]);
  const feeGst = r(mul(fees, pct(v.feeGstRatePercent)));
  const direct = sum([
    v.packagingCost,
    v.shippingCost,
    v.warehousingCost,
    v.labourCost,
    v.overheadCost,
  ]);
  const perReturn = add(v.reverseShippingCost, mul(v.productCost, pct(v.damagedLossPercent)));
  const returnLoss = add(r(mul(pct(v.returnRatePercent), perReturn)), v.expectedReturnCost);
  const other = add(v.advertisingCost, v.otherCost);
  const total = sum([v.productCost, direct, fees, feeGst, other, returnLoss]);
  return {
    net,
    gstInPrice: sub(v.sellingPrice, net),
    commission,
    fees,
    feeGst,
    direct,
    returnLoss,
    other,
    total,
  };
}

/**
 * Prices solved in closed form from profit(p) = a·p − F, where a is the revenue share less the
 * commission and its GST, and F every cost that does not move with the price.
 */
function solver(v: UnitInputs, l: Lines) {
  const feeGstFactor = add('1', pct(v.feeGstRatePercent));
  const a = sub(revenueFactor(v), mul(pct(v.commissionPercent), feeGstFactor));
  const fixedFees = mul(sum([v.referralFee, v.closingFee, v.handlingFee]), feeGstFactor);
  const fixed = sum([v.productCost, l.direct, fixedFees, l.other, l.returnLoss]);
  const solve = (extra: string, slope: string) =>
    compare(slope, '0') > 0 ? div(add(fixed, extra), slope) : null;
  const marginSlope = (m: string) => sub(a, mul(pct(m), revenueFactor(v)));
  return {
    breakEven: solve('0', a),
    forProfit: v.targetProfit === null ? null : solve(v.targetProfit, a),
    forMargin:
      v.targetMarginPercent === null ? null : solve('0', marginSlope(v.targetMarginPercent)),
  };
}

function shares(v: UnitInputs, l: Lines, profit: string, r: (x: string) => string) {
  const of = (x: string) => r(mul(div(x, v.sellingPrice), '100'));
  return {
    productSharePercent: of(v.productCost),
    fulfillmentSharePercent: of(l.direct),
    feesSharePercent: of(add(l.fees, l.feeGst)),
    otherSharePercent: of(add(l.other, l.returnLoss)),
    gstSharePercent: of(l.gstInPrice),
    profitSharePercent: of(profit),
  };
}

export function computeUnitEconomics(v: UnitInputs, rounding: RoundingMode): UnitValues {
  const r = (x: string) => toFixedString(x, 2, rounding);
  const opt = (x: string | null) => (x === null ? null : r(x));
  const l = lines(v, r);
  const netProfit = sub(l.net, l.total);
  const withholding = r(mul(l.net, pct(v.withholdingPercent)));
  const solved = solver(v, l);
  return {
    gstInPrice: r(l.gstInPrice),
    netRevenue: r(l.net),
    directFulfillment: r(l.direct),
    commissionAmount: r(l.commission),
    marketplaceFees: r(l.fees),
    marketplaceFeeGst: r(l.feeGst),
    returnLoss: r(l.returnLoss),
    otherCosts: r(l.other),
    totalCosts: r(l.total),
    netProfit: r(netProfit),
    netMarginPercent: isZero(l.net) ? '0.00' : r(mul(div(netProfit, l.net), '100')),
    markupPercent: isZero(v.productCost) ? null : r(mul(div(netProfit, v.productCost), '100')),
    withholding,
    cashSettlement: r(sub(v.sellingPrice, sum([l.fees, l.feeGst, withholding, v.shippingCost]))),
    monthlyProfit: r(mul(netProfit, v.quantity)),
    monthlyRevenue: r(mul(v.sellingPrice, v.quantity)),
    breakEvenPrice: opt(solved.breakEven),
    priceForTargetProfit: opt(solved.forProfit),
    priceForTargetMargin: opt(solved.forMargin),
    ...shares(v, l, netProfit, r),
  };
}
