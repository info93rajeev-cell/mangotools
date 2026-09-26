import { describe, expect, it } from 'vitest';
import { fromJsonSafe, toJsonSafe } from './binary-json.ts';

describe('toJsonSafe / fromJsonSafe', () => {
  it('round-trips a Uint8Array through a real JSON string', () => {
    const bytes = new Uint8Array([80, 68, 70, 0, 255, 1]);
    const safe = toJsonSafe({ files: [{ name: 'a.pdf', bytes }] });
    const json = JSON.parse(JSON.stringify(safe));
    const restored = fromJsonSafe(json) as { files: { name: string; bytes: Uint8Array }[] };
    expect(restored.files[0]?.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(restored.files[0]?.bytes ?? [])).toEqual(Array.from(bytes));
    expect(restored.files[0]?.name).toBe('a.pdf');
  });

  it('round-trips an array larger than one String.fromCharCode chunk', () => {
    const bytes = new Uint8Array(0x8000 + 10).map((_, i) => i % 256);
    const restored = fromJsonSafe(JSON.parse(JSON.stringify(toJsonSafe(bytes)))) as Uint8Array;
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });

  it('leaves plain values, arrays and nested objects unchanged', () => {
    const value = { a: 1, b: 'text', c: [1, 2, { d: true }], e: null };
    expect(fromJsonSafe(JSON.parse(JSON.stringify(toJsonSafe(value))))).toEqual(value);
  });

  it('handles an empty Uint8Array', () => {
    const restored = fromJsonSafe(toJsonSafe(new Uint8Array(0))) as Uint8Array;
    expect(restored).toBeInstanceOf(Uint8Array);
    expect(restored).toHaveLength(0);
  });
});
