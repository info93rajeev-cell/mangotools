import type { EngineModule } from '@mangotools/core';
import { messages, traverseMessages } from './errors.ts';
import { levelingReduce } from './operations/leveling-reduce/operation.ts';
import { levelingReduceV2 } from './operations/leveling-reduce-v2/operation.ts';
import { traverseCompute } from './operations/traverse-compute/operation.ts';

export const engine: EngineModule = {
  engineId: 'survey',
  operations: [levelingReduce, levelingReduceV2, traverseCompute],
  messages: { ...messages, ...traverseMessages },
};

export { levelingReduce, levelingReduceV2, traverseCompute };
