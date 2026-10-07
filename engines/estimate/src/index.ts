import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { pricingMargin } from './operations/pricing-margin/operation.ts';
import { sellerProfitability } from './operations/seller-profitability/operation.ts';
import { taxGst } from './operations/tax-gst/operation.ts';

export const engine: EngineModule = {
  engineId: 'estimate',
  operations: [taxGst, pricingMargin, sellerProfitability],
  messages,
};

export { pricingMargin, sellerProfitability, taxGst };
