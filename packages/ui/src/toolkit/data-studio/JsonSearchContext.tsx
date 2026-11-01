import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { JsonMatcher } from './jsonSearch.ts';

export interface JsonSearchState {
  matcher: JsonMatcher | null;
  /** Zero-based index of the highlighted hit. */
  index: number;
  total: number;
  error: string | null;
  next: () => void;
  prev: () => void;
}

export const JsonSearchContext = createContext<JsonSearchState>({
  matcher: null,
  index: 0,
  total: 0,
  error: null,
  next: () => undefined,
  prev: () => undefined,
});

export const useJsonSearch = () => useContext(JsonSearchContext);
