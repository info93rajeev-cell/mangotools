import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { invoiceCommercial } from './operations/invoice-commercial/operation.ts';
import { invoiceCommercialV2 } from './operations/invoice-commercial-v2/operation.ts';
import { packingList } from './operations/packing-list/operation.ts';

export const engine: EngineModule = {
  engineId: 'export',
  operations: [invoiceCommercial, invoiceCommercialV2, packingList],
  messages,
};

export { invoiceCommercial, invoiceCommercialV2, packingList };
