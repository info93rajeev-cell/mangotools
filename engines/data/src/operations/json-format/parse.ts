/**
 * Lossless RFC 8259 parser. Scalars keep their raw text, so numbers and string escapes are
 * reproduced exactly as written. No JSON.parse is used. Plain functions over a state object.
 */

export type JsonNode =
  | { kind: 'object'; members: JsonMember[] }
  | { kind: 'array'; items: JsonNode[] }
  | { kind: 'scalar'; raw: string };

export interface JsonMember {
  rawKey: string;
  key: string;
  offset: number;
  value: JsonNode;
}

export type Expected =
  | 'value'
  | 'property-name'
  | 'colon'
  | 'comma-or-object-end'
  | 'comma-or-array-end'
  | 'end-of-input'
  | 'valid-number'
  | 'valid-escape'
  | 'closing-quote'
  | 'valid-string-character';

export type ParseFailure = { tag: 'syntax'; offset: number; expected: Expected } | { tag: 'depth' };

export function isParseFailure(value: unknown): value is ParseFailure {
  return typeof value === 'object' && value !== null && 'tag' in value;
}

export const MAX_DEPTH = 512;

export interface ParseStats {
  maxDepth: number;
  objectCount: number;
  arrayCount: number;
  duplicateKeyOffsets: number[];
}

interface State {
  s: string;
  i: number;
  stats: ParseStats;
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

function fail(offset: number, expected: Expected): never {
  throw { tag: 'syntax', offset, expected } satisfies ParseFailure;
}

function skipWs(st: State): void {
  for (;;) {
    const c = st.s.charCodeAt(st.i);
    if (c !== 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) return;
    st.i++;
  }
}

export function parseJson(text: string): { root: JsonNode; stats: ParseStats } {
  const st: State = {
    s: text,
    i: 0,
    stats: { maxDepth: 0, objectCount: 0, arrayCount: 0, duplicateKeyOffsets: [] },
  };
  skipWs(st);
  const root = parseValue(st, 0);
  skipWs(st);
  if (st.i < text.length) fail(st.i, 'end-of-input');
  return { root, stats: st.stats };
}

function parseValue(st: State, depth: number): JsonNode {
  const c = st.s[st.i];
  if (c === '{') return parseObject(st, depth + 1);
  if (c === '[') return parseArray(st, depth + 1);
  if (c === '"') return { kind: 'scalar', raw: parseString(st, false).raw };
  if (c === '-' || (c !== undefined && c >= '0' && c <= '9')) return parseNumber(st);
  for (const lit of ['true', 'false', 'null']) {
    if (st.s.startsWith(lit, st.i)) {
      st.i += lit.length;
      return { kind: 'scalar', raw: lit };
    }
  }
  return fail(st.i, 'value');
}

function enter(st: State, depth: number): void {
  if (depth > MAX_DEPTH) throw { tag: 'depth' } satisfies ParseFailure;
  if (depth > st.stats.maxDepth) st.stats.maxDepth = depth;
}

function parseObject(st: State, depth: number): JsonNode {
  enter(st, depth);
  st.stats.objectCount++;
  st.i++;
  const members: JsonMember[] = [];
  const seen = new Set<string>();
  skipWs(st);
  if (st.s[st.i] === '}') {
    st.i++;
    return { kind: 'object', members };
  }
  for (;;) {
    skipWs(st);
    if (st.s[st.i] !== '"') fail(st.i, 'property-name');
    const offset = st.i;
    const { raw, decoded } = parseString(st, true);
    if (seen.has(decoded)) st.stats.duplicateKeyOffsets.push(offset);
    seen.add(decoded);
    skipWs(st);
    if (st.s[st.i] !== ':') fail(st.i, 'colon');
    st.i++;
    skipWs(st);
    members.push({ rawKey: raw, key: decoded, offset, value: parseValue(st, depth) });
    skipWs(st);
    const c = st.s[st.i++];
    if (c === '}') return { kind: 'object', members };
    if (c !== ',') fail(st.i - 1, 'comma-or-object-end');
  }
}

function parseArray(st: State, depth: number): JsonNode {
  enter(st, depth);
  st.stats.arrayCount++;
  st.i++;
  const items: JsonNode[] = [];
  skipWs(st);
  if (st.s[st.i] === ']') {
    st.i++;
    return { kind: 'array', items };
  }
  for (;;) {
    skipWs(st);
    items.push(parseValue(st, depth));
    skipWs(st);
    const c = st.s[st.i++];
    if (c === ']') return { kind: 'array', items };
    if (c !== ',') fail(st.i - 1, 'comma-or-array-end');
  }
}

function parseNumber(st: State): JsonNode {
  NUMBER.lastIndex = st.i;
  const m = NUMBER.exec(st.s);
  if (!m) return fail(st.i, 'valid-number');
  st.i += m[0].length;
  return { kind: 'scalar', raw: m[0] };
}

/** Parses a string starting at the opening quote. Decodes escapes only when `decode` is true. */
function parseString(st: State, decode: boolean): { raw: string; decoded: string } {
  const start = st.i;
  st.i++;
  let decoded = '';
  for (;;) {
    if (st.i >= st.s.length) fail(st.i, 'closing-quote');
    const code = st.s.charCodeAt(st.i);
    if (code === 0x22) break;
    if (code < 0x20) fail(st.i, 'valid-string-character');
    if (code === 0x5c) {
      const ch = parseEscape(st);
      if (decode) decoded += ch;
      continue;
    }
    if (decode) decoded += st.s[st.i];
    st.i++;
  }
  st.i++;
  return { raw: st.s.slice(start, st.i), decoded };
}

function parseEscape(st: State): string {
  const e = st.s[st.i + 1] ?? '';
  const simple = ESCAPES[e];
  if (simple !== undefined) {
    st.i += 2;
    return simple;
  }
  const hex = st.s.slice(st.i + 2, st.i + 6);
  if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(hex)) {
    st.i += 6;
    return String.fromCharCode(Number.parseInt(hex, 16));
  }
  return fail(st.i, 'valid-escape');
}

/** 1-based line and column (UTF-16 code units; a tab counts as one column). */
export function lineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    const c = text[i];
    if (c === '\n' || (c === '\r' && text[i + 1] !== '\n')) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}
