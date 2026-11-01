/** Pure helpers for the Base64 studio. The engine does all encoding and decoding. */

export type Base64Mode = 'encode' | 'decode' | 'auto';
export type Base64Source = 'text' | 'file' | 'image' | 'base64';

export interface Base64Result {
  text: string;
  byteLength: number;
  isUtf8: boolean;
  hexPreview?: string;
  binary?: string;
  mime?: string;
  inputByteLength: number;
}

export function readBase64Result(value: Record<string, unknown> | undefined): Base64Result | null {
  if (!value || typeof value.text !== 'string') return null;
  return {
    text: value.text,
    byteLength: Number(value.byteLength ?? 0),
    isUtf8: value.isUtf8 !== false,
    hexPreview: typeof value.hexPreview === 'string' ? value.hexPreview : undefined,
    binary: typeof value.binary === 'string' ? value.binary : undefined,
    mime: typeof value.mime === 'string' ? value.mime : undefined,
    inputByteLength: Number(value.inputByteLength ?? value.byteLength ?? 0),
  };
}

const ALPHABET = /^[A-Za-z0-9+/_-]+={0,2}$/;
const DATA_URI = /^data:[^,]*;base64,/i;

/**
 * Auto Detect: treat the input as Base64 when it is only Base64 characters, its length is a
 * multiple of 4 (or it is a data URI), and it is not a short plain word. Everything else is
 * text to encode. A guess, so the chosen direction is always shown and can be changed.
 */
export function looksLikeBase64(text: string): boolean {
  const trimmed = text.trim();
  if (DATA_URI.test(trimmed)) return true;
  const compact = trimmed.replace(/\s+/g, '');
  if (compact.length < 4 || !ALPHABET.test(compact)) return false;
  if (compact.length % 4 !== 0 && !/[-_]/.test(compact)) return false;
  return /[0-9+/=_-]/.test(compact) || compact.length >= 16;
}

/** Bytes of a file as a latin1 string (one character per byte), the engine's binary form. */
export function bufferToLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}

export function latin1ToBytes(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(text.length));
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

const EXTENSION: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'text/plain': 'txt',
};

export function extensionFor(mime: string | undefined): string {
  return (mime && EXTENSION[mime]) || 'bin';
}

export function countLines(text: string): number {
  return text === '' ? 0 : text.split('\n').length;
}

/** Size change from input to output, e.g. +33.3% for encoding. */
export function sizeChange(inputBytes: number, outputBytes: number): string {
  if (inputBytes === 0) return '0%';
  const pct = ((outputBytes - inputBytes) / inputBytes) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export const EXAMPLE_GROUPS: Readonly<Record<string, readonly string[]>> = {
  Text: ['Hello, BeyondTheAI!', 'The quick brown fox jumps over the lazy dog.', 'हेलो दुनिया! 🌍'],
  JSON: ['{"name":"Raj","city":"Mumbai"}', '{"ok":true,"items":[1,2,3]}'],
  URL: ['https://beyandtheai.com/?q=base64&lang=hi', 'name=Raj Patel&city=New Delhi'],
  Unicode: ['₹ 1,250 — नमस्ते', 'Emoji: 🚀✨👋', '日本語テキスト'],
  File: [
    'data:text/plain;base64,SGVsbG8sIEJleW9uZFRoZUFJIQ==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  ],
};
