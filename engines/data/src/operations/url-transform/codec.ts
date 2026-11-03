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

export interface EncodeOptions {
  /** How a space is written: by mode (form → +, else %20), always %20, or always +. */
  space: 'default' | 'percent' | 'plus';
  /** Encode the sub-delimiters ! ' ( ) * in component and form modes (RFC 3986 strict). */
  encodeSubDelims: boolean;
  /** Leave an existing valid %XX escape as it is instead of encoding its % again. */
  keepEscapes: boolean;
}

export const DEFAULT_ENCODE: EncodeOptions = {
  space: 'default',
  encodeSubDelims: true,
  keepEscapes: false,
};

const SUB_DELIMS = new Set(['!', "'", '(', ')', '*']);

function keepAsIs(
  text: string,
  offset: number,
  ch: string,
  mode: UrlMode,
  opts: EncodeOptions,
): boolean {
  if (UNRESERVED.test(ch)) return true;
  const validEscape = ch === '%' && HEX.test(text.slice(offset + 1, offset + 3));
  if (mode !== 'full-url') {
    return (opts.keepEscapes && validEscape) || (!opts.encodeSubDelims && SUB_DELIMS.has(ch));
  }
  return RESERVED.has(ch) || validEscape;
}

function spaceFor(mode: UrlMode, opts: EncodeOptions): string {
  if (opts.space === 'plus') return '+';
  if (opts.space === 'percent') return '%20';
  return mode === 'form' ? '+' : '%20';
}

function percentEncode(ch: string, encoder: TextEncoder): string {
  let out = '';
  for (const b of encoder.encode(ch)) out += percent(b);
  return out;
}

export function encodeUrl(
  text: string,
  mode: UrlMode,
  opts: EncodeOptions = DEFAULT_ENCODE,
): CodecResult {
  const encoder = new TextEncoder();
  let out = '';
  let changed = 0;
  let offset = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xd800 && cp <= 0xdfff) return { ok: false, code: 'DATA_URL_INVALID_UTF8', offset };
    const kept = keepAsIs(text, offset, ch, mode, opts);
    if (kept) out += ch;
    else out += ch === ' ' ? spaceFor(mode, opts) : percentEncode(ch, encoder);
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

function decodeLiteral(
  text: string,
  i: number,
  mode: UrlMode,
  encoder: TextEncoder,
  plusIsSpace = mode === 'form',
): DecodeStep {
  if (plusIsSpace && text[i] === '+') return { bytes: [0x20], length: 1, changed: true };
  const ch = String.fromCodePoint(text.codePointAt(i) ?? 0);
  return { bytes: [...encoder.encode(ch)], length: ch.length, changed: false };
}

export function decodeUrl(text: string, mode: UrlMode, plusIsSpace = mode === 'form'): CodecResult {
  const encoder = new TextEncoder();
  const bytes: number[] = [];
  let changed = 0;
  let i = 0;
  while (i < text.length) {
    const step =
      text[i] === '%'
        ? decodeEscape(text, i, mode, encoder)
        : decodeLiteral(text, i, mode, encoder, plusIsSpace);
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
