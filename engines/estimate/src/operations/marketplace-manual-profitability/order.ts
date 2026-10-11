import { add, div, mul, type RoundingMode, sub, toFixedString } from '@mangotools/engine-numeric';
import type { Order, OrderValues } from './model.ts';
import type { Scenario } from './schema.ts';

export function money(value: string, rounding: RoundingMode): string {
  return toFixedString(value, 2, rounding);
}

export function sumMoney(values: readonly string[], rounding: RoundingMode): string {
  return money(
    values.reduce((total, value) => add(total, value), '0'),
    rounding,
  );
}

/** `value × percent / 100`, rounded to money. */
export function percentOf(value: string, percent: string, rounding: RoundingMode): string {
  return money(div(mul(value, percent), '100'), rounding);
}

/** TASK-008L steps 1 and 2: order values, then the values recognised for the scenario. */
export function orderValues(order: Order, scenario: Scenario, rounding: RoundingMode): OrderValues {
  const grossCustomerValue = money(mul(order.sellingPricePerUnit, order.quantity), rounding);
  const sellerFundedReduction = money(
    add(order.promotionalDiscount, order.couponDiscount),
    rounding,
  );
  const realizedCustomerValue = money(sub(grossCustomerValue, sellerFundedReduction), rounding);
  const onePlusRate = add('1', div(order.productGstRatePercent, '100'));
  let taxExclusiveRevenue: string;
  let orderProductGstAmount: string;
  let customerInvoiceValue: string;
  if (order.taxMode === 'gst-inclusive') {
    taxExclusiveRevenue = money(div(realizedCustomerValue, onePlusRate), rounding);
    orderProductGstAmount = money(sub(realizedCustomerValue, taxExclusiveRevenue), rounding);
    customerInvoiceValue = realizedCustomerValue;
  } else {
    taxExclusiveRevenue = realizedCustomerValue;
    orderProductGstAmount = percentOf(realizedCustomerValue, order.productGstRatePercent, rounding);
    customerInvoiceValue = money(add(realizedCustomerValue, orderProductGstAmount), rounding);
  }
  const productCostTotal = money(mul(order.productCostPerUnit, order.quantity), rounding);
  const success = scenario === 'successful-sale';
  return {
    grossCustomerValue,
    sellerFundedReduction,
    realizedCustomerValue,
    customerInvoiceValue,
    orderProductGstAmount,
    taxExclusiveRevenue,
    productCostTotal,
    revenueRecognised: success ? taxExclusiveRevenue : '0.00',
    invoiceValueSettled: success ? customerInvoiceValue : '0.00',
    productCostRecognised: success ? productCostTotal : '0.00',
    productGstLiabilityRecognised: success ? orderProductGstAmount : '0.00',
  };
}
