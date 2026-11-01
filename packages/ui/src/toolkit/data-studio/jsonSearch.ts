/** Search over a parsed JSON value: matches keys and primitive values as shown in the tree. */
export type JsonMatcher = (text: string) => boolean;

export interface MatcherResult {
  matcher: JsonMatcher | null;
  error: string | null;
}

export function makeMatcher(query: string, matchCase: boolean, useRegex: boolean): MatcherResult {
  if (!query.trim()) return { matcher: null, error: null };
  if (useRegex) {
    try {
      const re = new RegExp(query, matchCase ? '' : 'i');
      return { matcher: (text) => re.test(text), error: null };
    } catch {
      return { matcher: null, error: 'Invalid regular expression' };
    }
  }
  const needle = matchCase ? query : query.toLowerCase();
  return {
    matcher: (text) => (matchCase ? text : text.toLowerCase()).includes(needle),
    error: null,
  };
}

/** The text a primitive shows in the tree (strings without quotes). */
export const displayValue = (value: unknown): string =>
  value === null ? 'null' : typeof value === 'string' ? value : String(value);

const isContainer = (v: unknown): v is Record<string, unknown> | unknown[] =>
  v !== null && typeof v === 'object';

function entries(v: Record<string, unknown> | unknown[]): [string, unknown][] {
  return Array.isArray(v) ? v.map((item, i) => [String(i), item]) : Object.entries(v);
}

/** Number of hits in tree order: each matching key, plus each matching primitive value. */
export function countHits(value: unknown, matcher: JsonMatcher | null): number {
  if (!matcher) return 0;
  if (!isContainer(value)) return matcher(displayValue(value)) ? 1 : 0;
  let total = 0;
  for (const [key, child] of entries(value)) {
    if (matcher(key)) total += 1;
    total += countHits(child, matcher);
  }
  return total;
}

/** True when a key or value anywhere below `value` matches (used to auto-open tree nodes). */
export function subtreeHasHit(value: unknown, matcher: JsonMatcher | null): boolean {
  return countHits(value, matcher) > 0;
}
