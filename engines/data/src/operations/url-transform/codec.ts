/** Percent-encoding per RFC 3986, plus application/x-www-form-urlencoded for `form` mode. */

export type UrlMode = 'component' | 'full-url' | 'form';

const UNRESERVED = /^[A-Za-z0-9\-._~]$/;
const RESERVED = new Set([
  ':',
  '/',
  '?',
  '#',
  '[',
  ']',
  '@',
  '!',
  '$',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  ';',
  '=',
]);
const HEX = /^[0-9A-Fa-f]{2}$/;

function percent(byte: number): string {
  return `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}

export type CodecResult =
  | { ok: true; text: string; changedCount: number }
  | { ok: false; code: 'DATA_URL_MALFORMED_ESCAPE' | 'DATA_URL_INVALID_UTF8'; offset?: number };

function keepAsIs(text: string, offset: number, ch: string, mode: UrlMode): boolean {
  if (UNRESERVED.test(ch)) return true;
  if (mode !== 'full-url') return false;
  return RESERVED.has(ch) || (ch === '%' && HEX.test(text.slice(offset + 1, offset + 3)));
}

function percentEncode(ch: string, encoder: TextEncoder): string {
  let out = '';
  for (const b of encoder.encode(ch)) out += percent(b);
  return out;
}

export function encodeUrl(text: string, mode: UrlMode): CodecResult {
  const encoder = new TextEncoder();
  let out = '';
  let changed = 0;
  let offset = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xd800 && cp <= 0xdfff) return { ok: false, code: 'DATA_URL_INVALID_UTF8', offset };
    const kept = keepAsIs(text, offset, ch, mode);
    if (kept) out += ch;
    else out += mode === 'form' && ch === ' ' ? '+' : percentEncode(ch, encoder);
    if (!kept) changed++;
    offset += ch.length;
  }
  return { ok: true, text: out, changedCount: changed };
}

interface DecodeStep {
  bytes: number[];
  length: number;
  changed: boolean;
}

/** Decodes one "%XX" escape at `i`; reserved characters stay escaped in full-URL mode. */
function decodeEscape(
  text: string,
  i: number,
  mode: UrlMode,
  encoder: TextEncoder,
): DecodeStep | null {
  const hex = text.slice(i + 1, i + 3);
  if (!HEX.test(hex)) return null;
  const byte = Number.parseInt(hex, 16);
  if (mode === 'full-url' && byte < 0x80 && RESERVED.has(String.fromCharCode(byte))) {
    return { bytes: [...encoder.encode(text.slice(i, i + 3))], length: 3, changed: false };
  }
  return { bytes: [byte], length: 3, changed: true };
}

function decodeLiteral(text: string, i: number, mode: UrlMode, encoder: TextEncoder): DecodeStep {
  if (mode === 'form' && text[i] === '+') return { bytes: [0x20], length: 1, changed: true };
  const ch = String.fromCodePoint(text.codePointAt(i) ?? 0);
  return { bytes: [...encoder.encode(ch)], length: ch.length, changed: false };
}

export function decodeUrl(text: string, mode: UrlMode): CodecResult {
  const encoder = new TextEncoder();
  const bytes: number[] = [];
  let changed = 0;
  let i = 0;
  while (i < text.length) {
    const step =
      text[i] === '%'
        ? decodeEscape(text, i, mode, encoder)
        : decodeLiteral(text, i, mode, encoder);
    if (!step) return { ok: false, code: 'DATA_URL_MALFORMED_ESCAPE', offset: i };
    bytes.push(...step.bytes);
    if (step.changed) changed++;
    i += step.length;
  }
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      new Uint8Array(bytes),
    );
    return { ok: true, text: decoded, changedCount: changed };
  } catch {
    return { ok: false, code: 'DATA_URL_INVALID_UTF8' };
  }
}
