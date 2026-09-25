import { defineOperation, ok } from '@mangotools/core';
import { z } from 'zod';
import { buildIndex } from '../../lib/searcher.ts';

const document = z.strictObject({
  id: z.string(),
  kind: z.literal('tool'),
  name: z.string(),
  shortName: z.string(),
  summary: z.string(),
  synonyms: z.string(),
  categoryName: z.string(),
  tags: z.string(),
});

export const indexBuild = defineOperation({
  id: 'search.index.build',
  major: 1,
  title: 'Build search index',
  summary: 'Builds a serialized full-text index from tool documents (build time).',
  input: z.strictObject({ documents: z.array(document) }),
  params: z.strictObject({}),
  output: z.strictObject({ index: z.string(), documentCount: z.int() }),
  errors: [],
  runtimes: ['node', 'worker'],
  cost: { weight: 'light' },
  exposure: 'internal',
  dataClass: 'public',
  run(input) {
    return ok({ index: buildIndex(input.documents), documentCount: input.documents.length });
  },
});
