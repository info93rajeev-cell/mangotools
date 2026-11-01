/** Pure helpers for the URL studio. The engine does all encoding and decoding. */

export type UrlSource = 'text' | 'file' | 'query' | 'form';
export type UrlMode = 'component' | 'full-url' | 'form';

export interface QueryParam {
  key: string;
  value: string;
}

export interface UrlResult {
  text: string;
  changedCount: number;
  params: QueryParam[];
}

export function readUrlResult(value: Record<string, unknown> | undefined): UrlResult | null {
  if (!value || typeof value.text !== 'string') return null;
  return {
    text: value.text,
    changedCount: Number(value.changedCount ?? 0),
    params: Array.isArray(value.params) ? (value.params as QueryParam[]) : [],
  };
}

export interface UrlParts {
  scheme: string;
  host: string;
  path: string;
  fragment: string;
}

/** Scheme, host, path and fragment of the first line when it looks like an absolute URL. */
export function urlParts(text: string): UrlParts | null {
  const first = text.trim().split(/\r?\n/)[0] ?? '';
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#\s]*)([^?#\s]*)[^#\s]*(?:#(\S*))?/i.exec(first);
  if (!match) return null;
  return {
    scheme: (match[1] ?? '').toLowerCase(),
    host: match[2] ?? '',
    path: match[3] || '/',
    fragment: match[4] ?? '',
  };
}

export type Row = [string, string];

export function rowsToPairs(rows: readonly Row[]): string {
  return JSON.stringify(rows.filter(([k, v]) => k !== '' || v !== ''));
}

/** Rows to start the Query tab from: the parameters found in the text, or one empty row. */
export function rowsFromParams(params: readonly QueryParam[]): Row[] {
  return params.length > 0 ? params.map((p) => [p.key, p.value]) : [['', '']];
}

/** The base of a URL (everything before `?`), used to put a built query back on the URL. */
export function baseOf(text: string): string {
  const first = text.trim().split(/\r?\n/)[0] ?? '';
  return urlParts(first) ? (first.split('?')[0] ?? '') : '';
}

export function isHttpUrl(text: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(text.trim());
}

/** First-open example (the approved reference screen): a URL, a query, text and Hindi, one per
 *  line. Kept in code, not in the preset, so no absolute URL is written into the page HTML. */
export const REFERENCE_TEXT =
  'https://beyandtheai.com/search?q=developer tools\n&lang=en&category=web development\nHello World! 100%\nनाम=दिल्ली & city=New York';

export const MODE_LABEL: Readonly<Record<UrlMode, string>> = {
  component: 'URL Encode (RFC 3986)',
  'full-url': 'Full URL (keep : / ? # & =)',
  form: 'Form data (x-www-form-urlencoded)',
};

export const URL_EXAMPLES: Readonly<Record<string, readonly string[]>> = {
  URL: ['https://beyandtheai.com/search?q=test', 'https://beyandtheai.com/tools?id=42&size=M'],
  'Query Parameter': ['name=John Doe&city=New York', 'q=price ₹500–₹1,000&sort=asc'],
  'Form Data': ['first name=Raj&last name=Patel', 'message=Hello, World!'],
  'Special Chars': ['Hello World! 100%', 'नाम=दिल्ली & city=New York', 'a+b=c / d?e#f'],
};
