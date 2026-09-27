import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { concreteQuantity } from './operations/concrete-quantity/operation.ts';

export const engine: EngineModule = {
  engineId: 'civil',
  operations: [concreteQuantity],
  messages,
};

export { concreteQuantity };
