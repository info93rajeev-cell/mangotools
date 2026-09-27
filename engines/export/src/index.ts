import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { invoiceCommercial } from './operations/invoice-commercial/operation.ts';

export const engine: EngineModule = {
  engineId: 'export',
  operations: [invoiceCommercial],
  messages,
};

export { invoiceCommercial };
