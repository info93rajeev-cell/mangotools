/** RFC 4648 Base64 codec implemented without btoa/atob. */

const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeGroup(bytes: Uint8Array, i: number, alphabet: string, padding: boolean): string {
  const b0 = bytes[i] ?? 0;
  const b1 = bytes[i + 1] ?? 0;
  const b2 = bytes[i + 2] ?? 0;
  const remaining = bytes.length - i;
  const pad = padding ? '=' : '';
  const c2 = remaining > 1 ? alphabet[((b1 & 0x0f) << 2) | (b2 >> 6)] : pad;
  const c3 = remaining > 2 ? alphabet[b2 & 0x3f] : pad;
  return `${alphabet[b0 >> 2]}${alphabet[((b0 & 0x03) << 4) | (b1 >> 4)]}${c2}${c3}`;
}

function wrapLines(text: string, lineLength: number): string {
  if (lineLength <= 0) return text;
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += lineLength) lines.push(text.slice(i, i + lineLength));
  return lines.join('\r\n');
}

export function encodeBase64(
  bytes: Uint8Array,
  options: { urlSafe: boolean; padding: boolean; lineLength: number },
): string {
  const alphabet = options.urlSafe ? URL_SAFE : STANDARD;
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) out += encodeGroup(bytes, i, alphabet, options.padding);
  return wrapLines(out, options.lineLength);
}

type Variant = 'standard' | 'url-safe' | 'auto';

export type DecodeFailure =
  | { code: 'DATA_BASE64_INVALID_CHARACTER'; offset: number }
  | { code: 'DATA_BASE64_INVALID_LENGTH' };

function sextet(c: string, variant: Variant): number {
  const std = STANDARD.indexOf(c);
  if (std >= 0 && std < 62) return std;
  if ((c === '+' || c === '/') && variant !== 'url-safe') return STANDARD.indexOf(c);
  if ((c === '-' || c === '_') && variant !== 'standard') return URL_SAFE.indexOf(c);
  return -1;
}

const WHITESPACE = new Set([' ', '\t', '\n', '\r', '\f']);

type Sextets =
  | { ok: true; values: number[]; padding: number }
  | { ok: false; failure: DecodeFailure };

const SKIP = -2;
const PAD = -3;

/** Sextet value of one character, or SKIP (whitespace), PAD ("=") or -1 (invalid here). */
function classify(c: string, padding: number, variant: Variant): number {
  if (WHITESPACE.has(c)) return SKIP;
  if (c === '=') return PAD;
  return padding > 0 ? -1 : sextet(c, variant);
}

/** Reads 6-bit values, skipping whitespace and counting trailing padding. */
function readSextets(text: string, variant: Variant): Sextets {
  const values: number[] = [];
  let padding = 0;
  for (let i = 0; i < text.length; i++) {
    const v = classify(text[i] ?? '', padding, variant);
    if (v === SKIP) continue;
    if (v === PAD) padding++;
    if (padding > 2) return { ok: false, failure: { code: 'DATA_BASE64_INVALID_LENGTH' } };
    if (v === -1)
      return { ok: false, failure: { code: 'DATA_BASE64_INVALID_CHARACTER', offset: i } };
    if (v >= 0) values.push(v);
  }
  return { ok: true, values, padding };
}

function sextetsToBytes(values: number[]): Uint8Array {
  const bytes = new Uint8Array(Math.floor((values.length * 6) / 8));
  let bi = 0;
  for (let i = 0; i < values.length; i += 4) {
    const v0 = values[i] ?? 0;
    const v1 = values[i + 1] ?? 0;
    const v2 = values[i + 2] ?? 0;
    const v3 = values[i + 3] ?? 0;
    bytes[bi++] = (v0 << 2) | (v1 >> 4);
    if (i + 2 < values.length) bytes[bi++] = ((v1 & 0x0f) << 4) | (v2 >> 2);
    if (i + 3 < values.length) bytes[bi++] = ((v2 & 0x03) << 6) | v3;
  }
  return bytes;
}

/** Decodes Base64, ignoring ASCII whitespace. Padding is optional but must be well-formed. */
export function decodeBase64(
  text: string,
  variant: Variant,
): { ok: true; bytes: Uint8Array } | { ok: false; failure: DecodeFailure } {
  const read = readSextets(text, variant);
  if (!read.ok) return read;
  const { values, padding } = read;
  const rem = values.length % 4;
  if (rem === 1 || (padding > 0 && (values.length + padding) % 4 !== 0)) {
    return { ok: false, failure: { code: 'DATA_BASE64_INVALID_LENGTH' } };
  }
  return { ok: true, bytes: sextetsToBytes(values) };
}
