import type { EngineModule } from '@mangotools/core';
import { messages, traverseMessages } from './errors.ts';
import { levelingReduce } from './operations/leveling-reduce/operation.ts';
import { traverseCompute } from './operations/traverse-compute/operation.ts';

export const engine: EngineModule = {
  engineId: 'survey',
  operations: [levelingReduce, traverseCompute],
  messages: { ...messages, ...traverseMessages },
};

export { levelingReduce, traverseCompute };
