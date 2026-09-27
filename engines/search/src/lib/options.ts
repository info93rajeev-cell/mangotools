import type { Options, SearchOptions } from 'minisearch';

export interface SearchDocument {
  id: string;
  kind: 'tool';
  name: string;
  shortName: string;
  summary: string;
  synonyms: string;
  categoryName: string;
  tags: string;
}

export const FIELDS = ['name', 'shortName', 'synonyms', 'summary', 'categoryName', 'tags'] as const;

/**
 * `name`/`shortName`/`synonyms`/`summary` are also stored (not just indexed) so the phrase-aware
 * ranking boost (see `phrase-boost.ts`) can re-read a candidate's own text at query time.
 */
export const INDEX_OPTIONS: Options<SearchDocument> = {
  idField: 'id',
  fields: [...FIELDS],
  storeFields: ['id', 'name', 'shortName', 'synonyms', 'summary'],
};

export const SEARCH_OPTIONS: SearchOptions = {
  boost: { name: 3, synonyms: 2, shortName: 2, summary: 1, categoryName: 1, tags: 1 },
  prefix: true,
  fuzzy: 0.2,
};
