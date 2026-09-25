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

export function encodeUrl(text: string, mode: UrlMode): CodecResult {
  const encoder = new TextEncoder();
  let out = '';
  let changed = 0;
  let offset = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xd800 && cp <= 0xdfff) return { ok: false, code: 'DATA_URL_INVALID_UTF8', offset };
    const keep =
      UNRESERVED.test(ch) ||
      (mode === 'full-url' &&
        (RESERVED.has(ch) || (ch === '%' && HEX.test(text.slice(offset + 1, offset + 3)))));
    if (keep) out += ch;
    else if (mode === 'form' && ch === ' ') {
      out += '+';
      changed++;
    } else {
      for (const b of encoder.encode(ch)) out += percent(b);
      changed++;
    }
    offset += ch.length;
  }
  return { ok: true, text: out, changedCount: changed };
}

export function decodeUrl(text: string, mode: UrlMode): CodecResult {
  const encoder = new TextEncoder();
  const bytes: number[] = [];
  let changed = 0;
  let i = 0;
  while (i < text.length) {
    const c = text[i] ?? '';
    if (c === '%') {
      const hex = text.slice(i + 1, i + 3);
      if (!HEX.test(hex)) return { ok: false, code: 'DATA_URL_MALFORMED_ESCAPE', offset: i };
      const byte = Number.parseInt(hex, 16);
      if (mode === 'full-url' && byte < 0x80 && RESERVED.has(String.fromCharCode(byte))) {
        for (const b of encoder.encode(text.slice(i, i + 3))) bytes.push(b);
      } else {
        bytes.push(byte);
        changed++;
      }
      i += 3;
    } else if (mode === 'form' && c === '+') {
      bytes.push(0x20);
      changed++;
      i++;
    } else {
      const cp = text.codePointAt(i) ?? 0;
      const ch = String.fromCodePoint(cp);
      for (const b of encoder.encode(ch)) bytes.push(b);
      i += ch.length;
    }
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
