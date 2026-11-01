import { decodeUrl } from './codec.ts';

export interface QueryParam {
  key: string;
  value: string;
}

export const MAX_QUERY_PARAMS = 200;

function lenient(part: string): string {
  const decoded = decodeUrl(part, 'form');
  return decoded.ok ? decoded.text : part;
}

/**
 * The query parameters of an encoded URL or query string: the part after the first `?` (up to
 * `#`), or the whole text when it has no `?` but contains `=`. Keys and values are decoded with
 * form rules (`+` is a space); a malformed escape is shown as written.
 */
export function parseQuery(encoded: string): QueryParam[] {
  const trimmed = encoded.trim();
  const q = trimmed.indexOf('?');
  if (q < 0 && !trimmed.includes('=')) return [];
  const query = (q >= 0 ? trimmed.slice(q + 1) : trimmed).split('#')[0] ?? '';
  return query
    .split('&')
    .filter((pair) => pair !== '')
    .slice(0, MAX_QUERY_PARAMS)
    .map((pair) => {
      const eq = pair.indexOf('=');
      const key = eq < 0 ? pair : pair.slice(0, eq);
      const value = eq < 0 ? '' : pair.slice(eq + 1);
      return { key: lenient(key), value: lenient(value) };
    });
}

/** Parses the pairs form value: a JSON array of [key, value] string pairs; null when invalid. */
export function readPairs(text: string): [string, string][] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    const ok = parsed.every(
      (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === 'string'),
    );
    return ok ? (parsed as [string, string][]) : null;
  } catch {
    return null;
  }
}
