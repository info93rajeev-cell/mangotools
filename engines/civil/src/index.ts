import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { brickworkQuantity } from './operations/brickwork-quantity/operation.ts';
import { concreteQuantity } from './operations/concrete-quantity/operation.ts';
import { excavationVolume } from './operations/excavation-volume/operation.ts';
import { plasterQuantity } from './operations/plaster-quantity/operation.ts';

export const engine: EngineModule = {
  engineId: 'civil',
  operations: [concreteQuantity, excavationVolume, brickworkQuantity, plasterQuantity],
  messages,
};

export { brickworkQuantity, concreteQuantity, excavationVolume, plasterQuantity };
