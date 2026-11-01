import { describe, expect, it } from 'vitest';
import { HIGHLIGHT_LIMIT, highlightJson } from './jsonSyntaxHighlight.ts';

describe('highlightJson', () => {
  it('marks keys, strings, numbers, booleans and null', () => {
    const html = highlightJson('{"a": "x", "n": -1.5e3, "t": true, "z": null}');
    expect(html).toContain('<span class="jk">"a"</span>:');
    expect(html).toContain('<span class="js">"x"</span>');
    expect(html).toContain('<span class="jd">-1.5e3</span>');
    expect(html).toContain('<span class="jb">true</span>');
    expect(html).toContain('<span class="jn">null</span>');
  });

  it('escapes markup so input cannot inject HTML', () => {
    const html = highlightJson('{"x": "<img src=x onerror=alert(1)>"}');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('keeps the text unchanged apart from markup', () => {
    const text = '{\n  "k": [1, 2, "a\\"b"]\n}';
    const plain = highlightJson(text)
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    expect(plain).toBe(`${text}\n`);
  });

  it('skips colouring for very large input', () => {
    const big = `"${'a'.repeat(HIGHLIGHT_LIMIT)}"`;
    expect(highlightJson(big)).not.toContain('<span');
  });
});
