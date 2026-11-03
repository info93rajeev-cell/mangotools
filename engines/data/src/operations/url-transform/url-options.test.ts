import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { urlTransform } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(urlTransform, { text }, params, createTestContext());
const text = async (input: string, params: Record<string, unknown> = {}) => {
  const r = await run(input, params);
  if (!r.ok) throw new Error(r.error.code);
  return r.value.text;
};

describe('data.url.transform options', () => {
  it('writes spaces as %20 or + on request', async () => {
    expect(await text('a b', { mode: 'form', space: 'percent' })).toBe('a%20b');
    expect(await text('a b', { space: 'plus' })).toBe('a+b');
    expect(await text('a+b', { direction: 'decode', space: 'plus' })).toBe('a b');
  });

  it("can leave ! ' ( ) * unencoded like encodeURIComponent", async () => {
    expect(await text("it's (ok)!*", { encodeSubDelims: false })).toBe("it's%20(ok)!*");
  });

  it('keeps existing escapes so text is not encoded twice', async () => {
    expect(await text('100%25 done', { keepEscapes: true })).toBe('100%25%20done');
    expect(await text('100%25 done')).toBe('100%2525%20done');
  });

  it('converts line breaks to CRLF before encoding', async () => {
    expect(await text('a\nb', { crlf: true })).toBe('a%0D%0Ab');
  });

  it('encodes and decodes each line on its own', async () => {
    expect(await text('a b\nc&d', { perLine: true })).toBe('a%20b\nc%26d');
    expect(await text('a%20b\r\nc', { direction: 'decode', perLine: true })).toBe('a b\r\nc');
  });

  it('builds a query from key/value pairs', async () => {
    const pairs = JSON.stringify([
      ['q', 'developer tools'],
      ['city', 'नई दिल्ली & co'],
    ]);
    expect(await text(pairs, { source: 'pairs', mode: 'form' })).toBe(
      'q=developer+tools&city=%E0%A4%A8%E0%A4%88+%E0%A4%A6%E0%A4%BF%E0%A4%B2%E0%A5%8D%E0%A4%B2%E0%A5%80+%26+co',
    );
    const bad = await run('not json', { source: 'pairs' });
    expect(!bad.ok && bad.error.code).toBe('DATA_URL_INVALID_PAIRS');
  });

  it('lists the query parameters of the encoded side', async () => {
    const r = await run('https://x.com/s?q=a+b&lang=en#top', {
      direction: 'decode',
      mode: 'full-url',
    });
    expect(r.ok && r.value.params).toEqual([
      { key: 'q', value: 'a b' },
      { key: 'lang', value: 'en' },
    ]);
    const component = await run('https://x.com/s?q=a b&n=1\nmore');
    expect(component.ok && component.value.params).toEqual([
      { key: 'q', value: 'a b' },
      { key: 'n', value: '1' },
    ]);
    const plain = await run('hello');
    expect(plain.ok && plain.value.params).toEqual([]);
  });
});
