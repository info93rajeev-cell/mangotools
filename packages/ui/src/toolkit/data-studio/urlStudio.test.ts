import { describe, expect, it } from 'vitest';
import {
  baseOf,
  isHttpUrl,
  readUrlResult,
  rowsFromParams,
  rowsToPairs,
  urlParts,
} from './urlStudio.ts';

describe('urlStudio helpers', () => {
  it('splits an absolute URL into parts', () => {
    expect(urlParts('https://Example.com/a/b?q=1#top')).toEqual({
      scheme: 'https',
      host: 'Example.com',
      path: '/a/b',
      fragment: 'top',
    });
    expect(urlParts('hello world')).toBeNull();
    expect(urlParts('https://x.com')?.path).toBe('/');
  });

  it('turns rows into engine pairs and back', () => {
    expect(
      rowsToPairs([
        ['q', 'a b'],
        ['', ''],
      ]),
    ).toBe('[["q","a b"]]');
    expect(rowsFromParams([])).toEqual([['', '']]);
    expect(rowsFromParams([{ key: 'k', value: 'v' }])).toEqual([['k', 'v']]);
  });

  it('finds the URL base and http URLs', () => {
    expect(baseOf('https://x.com/s?q=1\nmore')).toBe('https://x.com/s');
    expect(baseOf('q=1')).toBe('');
    expect(isHttpUrl('https://x.com/a b')).toBe(false);
    expect(isHttpUrl(' http://x.com/a ')).toBe(true);
  });

  it('reads results with or without params', () => {
    expect(readUrlResult({ text: 'a', changedCount: 0 })?.params).toEqual([]);
    expect(readUrlResult(undefined)).toBeNull();
  });
});
