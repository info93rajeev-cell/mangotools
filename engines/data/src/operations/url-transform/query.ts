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

/** Splits already-decoded text into parameters (first line only), without decoding again. */
export function parseQueryRaw(decoded: string): QueryParam[] {
  const first = decoded.trim().split(/\r?\n/)[0] ?? '';
  const q = first.indexOf('?');
  if (q < 0 && !first.includes('=')) return [];
  const query = (q >= 0 ? first.slice(q + 1) : first).split('#')[0] ?? '';
  return query
    .split('&')
    .filter((pair) => pair !== '')
    .slice(0, MAX_QUERY_PARAMS)
    .map((pair) => {
      const eq = pair.indexOf('=');
      return eq < 0
        ? { key: pair, value: '' }
        : { key: pair.slice(0, eq), value: pair.slice(eq + 1) };
    });
}

/**
 * Parameters of a transform: from the encoded side when it still shows the query structure
 * (exact even for values holding an encoded & or =), otherwise from the decoded side's first line.
 */
export function queryOf(encoded: string, decoded: string): QueryParam[] {
  const fromEncoded = parseQuery(encoded.split(/\r?\n/)[0] ?? '');
  return fromEncoded.length > 0 ? fromEncoded : parseQueryRaw(decoded);
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
