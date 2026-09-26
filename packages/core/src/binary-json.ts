/**
 * A generic, JSON-safe encoding for values that may contain `Uint8Array` bytes (binary/file-based
 * operations: PDF, image, audio, video). `JSON.stringify` turns a `Uint8Array` into a plain
 * `{"0":.., "1":..}` object, which does not round-trip back into a real `Uint8Array` through
 * `JSON.parse` — these two functions make that round-trip explicit and reversible, wherever a
 * fixture or operation value has to cross a JSON boundary (a generated `.json` file, a JSON module
 * import) rather than the structured-clone boundary a Worker's `postMessage` already handles
 * natively for `Uint8Array`.
 */

const MARKER = '__bytesBase64';
type BytesMarker = { [MARKER]: string };

/** Chunked so a large array never exceeds the argument-count limit of `String.fromCharCode`. */
const CHUNK_SIZE = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const isBytesMarker = (v: unknown): v is BytesMarker =>
  isRecord(v) && Object.keys(v).length === 1 && typeof v[MARKER] === 'string';

/** Recursively replaces every `Uint8Array` with a JSON-safe, self-describing marker object. */
export function toJsonSafe(value: unknown): unknown {
  if (value instanceof Uint8Array) return { [MARKER]: bytesToBase64(value) };
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSafe(v)]));
  }
  return value;
}

/** Reverses `toJsonSafe`: restores every marker object back into a real `Uint8Array`. */
export function fromJsonSafe(value: unknown): unknown {
  if (isBytesMarker(value)) return base64ToBytes(value[MARKER]);
  if (Array.isArray(value)) return value.map(fromJsonSafe);
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fromJsonSafe(v)]));
  }
  return value;
}
