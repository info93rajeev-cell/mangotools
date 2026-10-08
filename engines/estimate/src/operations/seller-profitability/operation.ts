import {
  defineOperation,
  err,
  type OpWarning,
  ok,
  type Result,
  type WorkingStep,
  warning,
} from '@mangotools/core';
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
import { readDecimal } from '../../lib/decimal-input.ts';
import {
  type SellerProfitabilityInput,
  type SellerProfitabilityOutput,
  sellerProfitabilityInput,
  sellerProfitabilityOutput,
  sellerProfitabilityParams,
} from './schema.ts';

interface Amounts {
  grossSellingPrice: string;
  productCost: string;
  marketplaceFees: string;
  shippingLogistics: string;
  sellerExpenses: string;
  expectedReturnRtoCost: string;
  nonRecoverableTaxCost: string;
  settlementOnlyDeductions: string;
}

function requiredMoney(raw: string | undefined, path: string): Result<string> {
  if (raw === undefined || raw === '') return err('ESTIMATE_MISSING_INPUT', { path });
  return readDecimal(raw, path, { maxDecimals: 2, allowNegative: false });
}

function optionalMoney(raw: string, path: string): Result<string> {
  return readDecimal(raw, path, { maxDecimals: 2, allowNegative: false });
}

function readAmounts(input: SellerProfitabilityInput): Result<Amounts> {
  const grossSellingPrice = requiredMoney(input.grossSellingPrice, 'grossSellingPrice');
  if (!grossSellingPrice.ok) return grossSellingPrice;
  if (compare(grossSellingPrice.value, '0') <= 0) {
    return err('ESTIMATE_PRICE_ZERO', { path: 'grossSellingPrice' });
  }
  const productCost = requiredMoney(input.productCost, 'productCost');
  if (!productCost.ok) return productCost;
  const fields = [
    optionalMoney(input.marketplaceFees, 'marketplaceFees'),
    optionalMoney(input.shippingLogistics, 'shippingLogistics'),
    optionalMoney(input.sellerExpenses, 'sellerExpenses'),
    optionalMoney(input.expectedReturnRtoCost, 'expectedReturnRtoCost'),
    optionalMoney(input.nonRecoverableTaxCost, 'nonRecoverableTaxCost'),
    optionalMoney(input.settlementOnlyDeductions, 'settlementOnlyDeductions'),
  ];
  const invalid = fields.find((field) => !field.ok);
  if (invalid && !invalid.ok) return invalid;
  const values = fields.map((field) => (field.ok ? field.value : '0'));
  return ok({
    grossSellingPrice: grossSellingPrice.value,
    productCost: productCost.value,
    marketplaceFees: values[0] ?? '0',
    shippingLogistics: values[1] ?? '0',
    sellerExpenses: values[2] ?? '0',
    expectedReturnRtoCost: values[3] ?? '0',
    nonRecoverableTaxCost: values[4] ?? '0',
    settlementOnlyDeductions: values[5] ?? '0',
  });
}

function sum(values: string[]): string {
  return values.reduce((total, value) => add(total, value), '0');
}

function money(value: string, rounding: RoundingMode): string {
  return toFixedString(value, 2, rounding);
}

function calculateValues(
  amounts: Amounts,
  rounding: RoundingMode,
): Omit<SellerProfitabilityOutput, 'working'> {
  const totalEconomicCost = money(
    sum([
      amounts.productCost,
      amounts.marketplaceFees,
      amounts.shippingLogistics,
      amounts.sellerExpenses,
      amounts.expectedReturnRtoCost,
      amounts.nonRecoverableTaxCost,
    ]),
    rounding,
  );
  const grossSellingPrice = money(amounts.grossSellingPrice, rounding);
  const economicProfit = money(sub(grossSellingPrice, totalEconomicCost), rounding);
  const totalSettlementDeductions = money(
    sum([amounts.marketplaceFees, amounts.shippingLogistics, amounts.settlementOnlyDeductions]),
    rounding,
  );
  const cashSettlement = money(sub(grossSellingPrice, totalSettlementDeductions), rounding);
  const profitMarginPercent = money(mul(div(economicProfit, grossSellingPrice), '100'), rounding);
  const markupPercent = isZero(amounts.productCost)
    ? null
    : money(mul(div(economicProfit, money(amounts.productCost, rounding)), '100'), rounding);
  return {
    economicProfit,
    cashSettlement,
    profitMarginPercent,
    markupPercent,
    totalEconomicCost,
    totalSettlementDeductions,
  };
}

function economicWorking(
  amounts: Amounts,
  value: Omit<SellerProfitabilityOutput, 'working'>,
  rounding: RoundingMode,
): WorkingStep[] {
  return [
    {
      ref: 'totalEconomicCost',
      formulaKey: 'sellerProfitability.totalEconomicCost',
      variables: {
        productCost: money(amounts.productCost, rounding),
        marketplaceFees: money(amounts.marketplaceFees, rounding),
        shippingLogistics: money(amounts.shippingLogistics, rounding),
        sellerExpenses: money(amounts.sellerExpenses, rounding),
        expectedReturnRtoCost: money(amounts.expectedReturnRtoCost, rounding),
        nonRecoverableTaxCost: money(amounts.nonRecoverableTaxCost, rounding),
      },
      result: value.totalEconomicCost,
    },
    {
      ref: 'economicProfit',
      formulaKey: 'sellerProfitability.economicProfit',
      variables: {
        grossSellingPrice: money(amounts.grossSellingPrice, rounding),
        totalEconomicCost: value.totalEconomicCost,
      },
      result: value.economicProfit,
    },
  ];
}

function settlementWorking(
  amounts: Amounts,
  value: Omit<SellerProfitabilityOutput, 'working'>,
  rounding: RoundingMode,
): WorkingStep[] {
  return [
    {
      ref: 'totalSettlementDeductions',
      formulaKey: 'sellerProfitability.totalSettlementDeductions',
      variables: {
        marketplaceFees: money(amounts.marketplaceFees, rounding),
        shippingLogistics: money(amounts.shippingLogistics, rounding),
        settlementOnlyDeductions: money(amounts.settlementOnlyDeductions, rounding),
      },
      result: value.totalSettlementDeductions,
    },
    {
      ref: 'cashSettlement',
      formulaKey: 'sellerProfitability.cashSettlement',
      variables: {
        grossSellingPrice: money(amounts.grossSellingPrice, rounding),
        totalSettlementDeductions: value.totalSettlementDeductions,
      },
      result: value.cashSettlement,
    },
  ];
}

function percentWorking(
  amounts: Amounts,
  value: Omit<SellerProfitabilityOutput, 'working'>,
  rounding: RoundingMode,
): WorkingStep[] {
  const working: WorkingStep[] = [
    {
      ref: 'profitMarginPercent',
      formulaKey: 'sellerProfitability.profitMarginPercent',
      variables: {
        economicProfit: value.economicProfit,
        grossSellingPrice: money(amounts.grossSellingPrice, rounding),
      },
      result: value.profitMarginPercent,
    },
  ];
  if (value.markupPercent !== null) {
    working.push({
      ref: 'markupPercent',
      formulaKey: 'sellerProfitability.markupPercent',
      variables: {
        economicProfit: value.economicProfit,
        productCost: money(amounts.productCost, rounding),
      },
      result: value.markupPercent,
    });
  }
  return working;
}

function calculate(amounts: Amounts, rounding: RoundingMode): SellerProfitabilityOutput {
  const value = calculateValues(amounts, rounding);
  const working = [
    ...economicWorking(amounts, value, rounding),
    ...settlementWorking(amounts, value, rounding),
    ...percentWorking(amounts, value, rounding),
  ];
  return {
    ...value,
    working,
  };
}

export const sellerProfitability = defineOperation({
  id: 'estimate.seller.profitability',
  major: 1,
  title: 'Seller profitability',
  summary: 'Calculates economic profit, cash settlement, margin and markup from resolved costs.',
  input: sellerProfitabilityInput,
  params: sellerProfitabilityParams,
  output: sellerProfitabilityOutput,
  errors: [
    'ESTIMATE_INVALID_NUMBER',
    'ESTIMATE_TOO_MANY_DECIMALS',
    'ESTIMATE_NEGATIVE_VALUE',
    'ESTIMATE_MISSING_INPUT',
    'ESTIMATE_PRICE_ZERO',
  ],
  runtimes: ['worker', 'node'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input, params) {
    const amounts = readAmounts(input);
    if (!amounts.ok) return amounts;
    const value = calculate(amounts.value, params.rounding);
    const warnings: OpWarning[] = [];
    if (value.markupPercent === null) {
      warnings.push(warning('ESTIMATE_MARKUP_UNDEFINED', { path: 'productCost' }));
    }
    return ok(value, warnings);
  },
});
