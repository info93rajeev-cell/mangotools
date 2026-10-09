import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { recordResolve } from './operations/record-resolve/operation.ts';

export const engine: EngineModule = {
  engineId: 'reference',
  operations: [recordResolve],
  messages,
};

export { recordResolve };
