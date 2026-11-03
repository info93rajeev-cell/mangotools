import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { marketplaceManualProfitability } from './operations/marketplace-manual-profitability/operation.ts';
import { pricingMargin } from './operations/pricing-margin/operation.ts';
import { pricingPricePlan } from './operations/pricing-price-plan/operation.ts';
import { sellerProfitability } from './operations/seller-profitability/operation.ts';
import { sellerUnitEconomics } from './operations/seller-unit-economics/operation.ts';
import { taxGst } from './operations/tax-gst/operation.ts';

export const engine: EngineModule = {
  engineId: 'estimate',
  operations: [
    taxGst,
    pricingMargin,
    sellerProfitability,
    marketplaceManualProfitability,
    sellerUnitEconomics,
    pricingPricePlan,
  ],
  messages,
};

export {
  marketplaceManualProfitability,
  pricingMargin,
  pricingPricePlan,
  sellerProfitability,
  sellerUnitEconomics,
  taxGst,
};
