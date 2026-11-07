import { defineOperation, type OpWarning, ok, type WorkingStep, warning } from '@mangotools/core';
import { computeUnitEconomics, type UnitValues } from './compute.ts';
import { readUnitInputs, type UnitInputs } from './read.ts';
import {
  sellerUnitEconomicsInput,
  sellerUnitEconomicsOutput,
  sellerUnitEconomicsParams,
} from './schema.ts';

function working(v: UnitInputs, out: UnitValues): WorkingStep[] {
  return [
    {
      ref: 'netRevenue',
      formulaKey: v.priceIncludesGst
        ? 'unitEconomics.netRevenueInclusive'
        : 'unitEconomics.netRevenue',
      variables: { sellingPrice: v.sellingPrice, gstRatePercent: v.gstRatePercent },
      result: out.netRevenue,
    },
    {
      ref: 'totalCosts',
      formulaKey: 'unitEconomics.totalCosts',
      variables: {
        productCost: v.productCost,
        directFulfillment: out.directFulfillment,
        marketplaceFees: out.marketplaceFees,
        marketplaceFeeGst: out.marketplaceFeeGst,
        otherCosts: out.otherCosts,
        returnLoss: out.returnLoss,
      },
      result: out.totalCosts,
    },
    {
      ref: 'netProfit',
      formulaKey: 'unitEconomics.netProfit',
      variables: { netRevenue: out.netRevenue, totalCosts: out.totalCosts },
      result: out.netProfit,
    },
    {
      ref: 'cashSettlement',
      formulaKey: 'unitEconomics.cashSettlement',
      variables: {
        sellingPrice: v.sellingPrice,
        marketplaceFees: out.marketplaceFees,
        marketplaceFeeGst: out.marketplaceFeeGst,
        withholding: out.withholding,
        shippingCost: v.shippingCost,
      },
      result: out.cashSettlement,
    },
  ];
}

function warningsFor(out: UnitValues): OpWarning[] {
  const list: OpWarning[] = [];
  if (out.markupPercent === null)
    list.push(warning('ESTIMATE_MARKUP_UNDEFINED', { path: 'productCost' }));
  if (out.breakEvenPrice === null) {
    list.push(warning('ESTIMATE_BREAK_EVEN_NOT_DETERMINABLE', { path: 'commissionPercent' }));
  }
  return list;
}

export const sellerUnitEconomics = defineOperation({
  id: 'estimate.seller.unit-economics',
  major: 1,
  title: 'Seller unit economics',
  summary:
    'Profit, margin, settlement and break-even for one product from price, GST, costs, fees and returns.',
  input: sellerUnitEconomicsInput,
  params: sellerUnitEconomicsParams,
  output: sellerUnitEconomicsOutput,
  errors: [
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_VALUE',
    'ESTIMATE_MISSING_INPUT',
    'ESTIMATE_PRICE_ZERO',
    'ESTIMATE_PERCENT_OUT_OF_RANGE',
    'ESTIMATE_GST_RATE_OUT_OF_RANGE',
    'ESTIMATE_INVALID_QUANTITY',
    'ESTIMATE_MARGIN_OUT_OF_RANGE',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const read = readUnitInputs(input);
    if (!read.ok) return read;
    const out = computeUnitEconomics(read.value, params.rounding);
    return ok({ ...out, working: working(read.value, out) }, warningsFor(out));
  },
});
