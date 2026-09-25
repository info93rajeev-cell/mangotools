import type { EngineModule } from '@mangotools/core';
import { messages } from './errors.ts';
import { indexBuild } from './operations/index-build/operation.ts';
import { query } from './operations/query/operation.ts';

export const engine: EngineModule = {
  engineId: 'search',
  operations: [indexBuild, query],
  messages,
};

export type { SearchDocument } from './lib/options.ts';
export { buildIndex, createSearcher, type SearchHit } from './lib/searcher.ts';
export { indexBuild, query };
