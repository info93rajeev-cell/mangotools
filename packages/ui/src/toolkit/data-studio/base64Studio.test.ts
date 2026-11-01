import { describe, expect, it } from 'vitest';
import {
  bufferToLatin1,
  countLines,
  extensionFor,
  latin1ToBytes,
  looksLikeBase64,
  readBase64Result,
  sizeChange,
} from './base64Studio.ts';

describe('base64Studio helpers', () => {
  it('guesses Base64 input conservatively', () => {
    expect(looksLikeBase64('SGVsbG8sIOKCuSB3b3JsZA==')).toBe(true);
    expect(looksLikeBase64('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(looksLikeBase64('Zm9v')).toBe(true);
    expect(looksLikeBase64('Test')).toBe(false);
    expect(looksLikeBase64('Hello, world')).toBe(false);
    expect(looksLikeBase64('HelloWorld')).toBe(false);
    expect(looksLikeBase64('aGVsbG8gd29ybGQgZm9v')).toBe(true);
  });

  it('round-trips bytes through the latin1 form', () => {
    const bytes = new Uint8Array([0, 137, 255, 65]);
    const text = bufferToLatin1(bytes.buffer);
    expect(Array.from(latin1ToBytes(text))).toEqual([0, 137, 255, 65]);
  });

  it('reads results, extensions, lines and size change', () => {
    expect(readBase64Result({ text: 'x', byteLength: 1, isUtf8: true })?.inputByteLength).toBe(1);
    expect(readBase64Result(undefined)).toBeNull();
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor(undefined)).toBe('bin');
    expect(countLines('a\nb')).toBe(2);
    expect(countLines('')).toBe(0);
    expect(sizeChange(96, 128)).toBe('+33.3%');
    expect(sizeChange(0, 5)).toBe('0%');
  });
});
