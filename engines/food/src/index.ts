import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { scheduleGenerate } from './operations/schedule-generate/operation.ts';
import { shoppingConsolidate } from './operations/shopping-consolidate/operation.ts';

export const engine: EngineModule = {
  engineId: 'food',
  operations: [shoppingConsolidate, scheduleGenerate],
  messages,
};

export { scheduleGenerate, shoppingConsolidate };
