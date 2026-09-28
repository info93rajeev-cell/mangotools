import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { invoiceCommercial } from './operations/invoice-commercial/operation.ts';
import { invoiceCommercialV2 } from './operations/invoice-commercial-v2/operation.ts';
import { packingList } from './operations/packing-list/operation.ts';
import { packingListV2 } from './operations/packing-list-v2/operation.ts';

export const engine: EngineModule = {
  engineId: 'export',
  operations: [invoiceCommercial, invoiceCommercialV2, packingList, packingListV2],
  messages,
};

export { invoiceCommercial, invoiceCommercialV2, packingList, packingListV2 };
