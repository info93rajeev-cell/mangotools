import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { concreteQuantity } from './operations/concrete-quantity/operation.ts';
import { excavationVolume } from './operations/excavation-volume/operation.ts';

export const engine: EngineModule = {
  engineId: 'civil',
  operations: [concreteQuantity, excavationVolume],
  messages,
};

export { concreteQuantity, excavationVolume };
