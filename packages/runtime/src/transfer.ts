/**
 * A one-shot, same-tab handoff of a flat string map, carried in a URL hash fragment. The browser
 * never sends a URL's fragment in the HTTP request for that URL (a plain platform fact, not specific
 * to this app), so this never reaches any server, log, or analytics call. It is not browser storage —
 * nothing is written to localStorage/sessionStorage/IndexedDB/cookies, and the caller is expected to
 * strip the hash (e.g. via `history.replaceState`) immediately after reading it, so it does not
 * linger in the visible URL or get re-applied on a later reload of the same page.
 */

const PREFIX = '#transfer=';

/** True when `hash` (as `location.hash` reports it, including the leading `#`) carries a payload. */
export function hasTransferHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

/** Builds the hash fragment (including the leading `#`) for navigating to `path` with `values`. */
export function encodeTransferHash(values: Record<string, string>): string {
  return `${PREFIX}${encodeURIComponent(JSON.stringify(values))}`;
}

/** Decodes a hash built by `encodeTransferHash`, or null if it is absent or malformed. */
export function decodeTransferHash(hash: string): Record<string, string> | null {
  if (!hasTransferHash(hash)) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(hash.slice(PREFIX.length)));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') values[key] = value;
    }
    return values;
  } catch {
    return null;
  }
}

/** Only the entries of `values` whose key is in `allowedKeys` (never trust a hash's own key set). */
export function filterTransferValues(
  values: Record<string, string>,
  allowedKeys: Iterable<string>,
): Record<string, string> {
  const allowed = new Set(allowedKeys);
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) if (allowed.has(key)) filtered[key] = value;
  return filtered;
}

/** Only the non-empty string values of `values` at the given `keys`, in one call for the sender. */
export function pickTransferValues(
  values: Record<string, string | boolean>,
  keys: readonly string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = values[key];
    if (typeof value === 'string' && value.trim() !== '') picked[key] = value;
  }
  return picked;
}
