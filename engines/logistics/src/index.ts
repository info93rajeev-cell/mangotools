import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { cbmCompute } from './operations/cbm-compute/operation.ts';

export const engine: EngineModule = {
  engineId: 'logistics',
  operations: [cbmCompute],
  messages,
};

export { cbmCompute };
