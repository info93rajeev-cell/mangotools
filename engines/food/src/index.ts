import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { costEstimate } from './operations/cost-estimate/operation.ts';
import { shoppingConsolidate } from './operations/shopping-consolidate/operation.ts';

export const engine: EngineModule = {
  engineId: 'food',
  operations: [shoppingConsolidate, costEstimate],
  messages,
};

export { costEstimate, shoppingConsolidate };
