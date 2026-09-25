import { defineOperation, err, ok } from '@mangotools/core';
import { z } from 'zod';
import { createSearcher } from '../../lib/searcher.ts';

export const query = defineOperation({
  id: 'search.query',
  major: 1,
  title: 'Search tools',
  summary: 'Queries a serialized index with prefix and typo-tolerant matching.',
  input: z.strictObject({
    index: z.string(),
    q: z.string(),
    limit: z.int().min(1).max(50).default(10),
  }),
  params: z.strictObject({}),
  output: z.strictObject({ hits: z.array(z.strictObject({ id: z.string(), score: z.number() })) }),
  errors: ['SEARCH_INDEX_INVALID'],
  runtimes: ['node', 'worker'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    let search: ReturnType<typeof createSearcher>;
    try {
      search = createSearcher(input.index);
    } catch {
      return err('SEARCH_INDEX_INVALID', { path: 'index' });
    }
    return ok({ hits: search(input.q, input.limit) });
  },
});
