import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { levelingReduce } from './operations/leveling-reduce/operation.ts';

export const engine: EngineModule = {
  engineId: 'survey',
  operations: [levelingReduce],
  messages,
};

export { levelingReduce };
