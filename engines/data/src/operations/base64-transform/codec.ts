/** RFC 4648 Base64 codec implemented without btoa/atob. */

const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encodeBase64(
  bytes: Uint8Array,
  options: { urlSafe: boolean; padding: boolean; lineLength: number },
): string {
  const alphabet = options.urlSafe ? URL_SAFE : STANDARD;
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    const remaining = bytes.length - i;
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += remaining > 1 ? alphabet[((b1 & 0x0f) << 2) | (b2 >> 6)] : options.padding ? '=' : '';
    out += remaining > 2 ? alphabet[b2 & 0x3f] : options.padding ? '=' : '';
  }
  if (options.lineLength > 0) {
    const lines: string[] = [];
    for (let i = 0; i < out.length; i += options.lineLength)
      lines.push(out.slice(i, i + options.lineLength));
    return lines.join('\r\n');
  }
  return out;
}

export type DecodeFailure =
  | { code: 'DATA_BASE64_INVALID_CHARACTER'; offset: number }
  | { code: 'DATA_BASE64_INVALID_LENGTH' };

function sextet(c: string, variant: 'standard' | 'url-safe' | 'auto'): number {
  const std = STANDARD.indexOf(c);
  if (std >= 0 && std < 62) return std;
  if ((c === '+' || c === '/') && variant !== 'url-safe') return STANDARD.indexOf(c);
  if ((c === '-' || c === '_') && variant !== 'standard') return URL_SAFE.indexOf(c);
  return -1;
}

const WHITESPACE = new Set([' ', '\t', '\n', '\r', '\f']);

/** Decodes Base64, ignoring ASCII whitespace. Padding is optional but must be well-formed. */
export function decodeBase64(
  text: string,
  variant: 'standard' | 'url-safe' | 'auto',
): { ok: true; bytes: Uint8Array } | { ok: false; failure: DecodeFailure } {
  const values: number[] = [];
  let padding = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] ?? '';
    if (WHITESPACE.has(c)) continue;
    if (c === '=') {
      padding++;
      if (padding > 2) return { ok: false, failure: { code: 'DATA_BASE64_INVALID_LENGTH' } };
      continue;
    }
    const v = padding > 0 ? -1 : sextet(c, variant);
    if (v < 0) return { ok: false, failure: { code: 'DATA_BASE64_INVALID_CHARACTER', offset: i } };
    values.push(v);
  }
  const rem = values.length % 4;
  if (rem === 1 || (padding > 0 && (values.length + padding) % 4 !== 0)) {
    return { ok: false, failure: { code: 'DATA_BASE64_INVALID_LENGTH' } };
  }
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
  return { ok: true, bytes };
}
