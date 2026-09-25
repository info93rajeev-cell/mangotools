import type { SearchIndexFile, SearchIndexTool } from '@mangotools/schemas';

export type SearchResult = SearchIndexTool;
export type SearchFn = (query: string, limit?: number) => SearchResult[];

/** Builds a query function from a generated search index (engines/search, main thread). */
export async function searcherFromIndex(file: SearchIndexFile): Promise<SearchFn> {
  const { createSearcher } = await import('@mangotools/engine-search');
  const query = createSearcher(file.index);
  const tools = new Map(file.tools.map((t) => [t.id, t]));
  return (q, limit = 8) =>
    query(q, limit)
      .map((hit) => tools.get(hit.id))
      .filter((t): t is SearchResult => t !== undefined);
}

let loading: Promise<SearchFn> | null = null;

/** Fetches /search-index.json (same origin, static) once and returns the query function. */
export function loadSearch(url = '/search-index.json'): Promise<SearchFn> {
  loading ??= fetch(url, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error(`search index: HTTP ${response.status}`);
      return response.json() as Promise<SearchIndexFile>;
    })
    .then(searcherFromIndex)
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}
