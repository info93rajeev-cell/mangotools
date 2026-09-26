import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { cbmCompute } from './operations/cbm-compute/operation.ts';
import { containerFit } from './operations/container-fit/operation.ts';
import { weightChargeable } from './operations/weight-chargeable/operation.ts';

export const engine: EngineModule = {
  engineId: 'logistics',
  operations: [cbmCompute, weightChargeable, containerFit],
  messages,
};

export { cbmCompute, containerFit, weightChargeable };
