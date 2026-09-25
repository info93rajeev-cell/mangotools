import MiniSearch from 'minisearch';
import { INDEX_OPTIONS, SEARCH_OPTIONS, type SearchDocument } from './options.ts';

export interface SearchHit {
  id: string;
  score: number;
}

export function buildIndex(documents: readonly SearchDocument[]): string {
  const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
  index.addAll([...documents].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
  return JSON.stringify(index);
}

/** Loads a serialized index once and returns a pure query function (callers keep the instance). */
export function createSearcher(serialized: string): (q: string, limit?: number) => SearchHit[] {
  const index = MiniSearch.loadJSON<SearchDocument>(serialized, INDEX_OPTIONS);
  return (q, limit = 10) => {
    if (q.trim() === '') return [];
    return index
      .search(q, SEARCH_OPTIONS)
      .map((r) => ({ id: String(r.id), score: Math.round(r.score * 1e6) / 1e6 }))
      .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .slice(0, limit);
  };
}
