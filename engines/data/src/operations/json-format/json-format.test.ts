import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { messages } from '../../errors.ts';
import { EXPECTED_TEXT } from './expected-text.ts';
import { jsonFormat } from './operation.ts';
import { lineColumn } from './parse.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(jsonFormat, { text }, params, createTestContext());

describe('data.json.format', () => {
  it('reports line and column across CRLF line endings', () => {
    expect(lineColumn('{\r\n  "a": ,\r\n}', 10)).toEqual({ line: 2, column: 8 });
  });

  it('removes a byte order mark with a warning', async () => {
    const result = await run('﻿{"a":1}', { action: 'minify' });
    expect(result.ok && result.value.text).toBe('{"a":1}');
    expect(result.ok && result.warnings.map((w) => w.code)).toEqual(['DATA_JSON_BOM_REMOVED']);
  });

  it('rejects nesting deeper than 512 levels', async () => {
    const result = await run(`${'['.repeat(600)}${']'.repeat(600)}`);
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TOO_DEEP');
  });

  it('rejects unescaped control characters and bad escapes', async () => {
    const control = await run('"a\u0001b"');
    expect(!control.ok && control.error.details?.expected).toBe('valid-string-character');
    const badEscape = await run('"\\x"');
    expect(!badEscape.ok && badEscape.error.details?.expected).toBe('valid-escape');
  });

  it('explains syntax errors in plain words, keeping line, column and the expected code', async () => {
    const result = await run('{"a":1,}');
    expect(!result.ok && result.error.details).toMatchObject({
      line: 1,
      column: 8,
      expected: 'property-name',
      expectedText: 'a property name in double quotes',
    });
    const details = !result.ok ? (result.error.details ?? {}) : {};
    const message = messages.DATA_JSON_SYNTAX_ERROR?.replace(/\{(\w+)\}/g, (_m, k: string) =>
      String(details[k]),
    );
    expect(message).toBe(
      'Invalid JSON at line 1, column 8. Expected a property name in double quotes.',
    );
  });

  it('has a plain phrase for every expected-token code', () => {
    for (const [code, text] of Object.entries(EXPECTED_TEXT)) {
      expect(text, code).toMatch(/^[a-z]/);
      expect(text, code).not.toContain('-or-');
    }
    expect(Object.keys(EXPECTED_TEXT)).toHaveLength(10);
  });

  it('uses tabs when asked', async () => {
    const result = await run('{"a":[1]}', { indent: 'tab' });
    expect(result.ok && result.value.text).toBe('{\n\t"a": [\n\t\t1\n\t]\n}');
  });

  it('formats 5 MB of JSON quickly (benchmark)', async () => {
    const item =
      '{"id":1234567890123,"name":"Caf\\u00e9 item","tags":["a","b","c"],"price":12.50,"ok":true}';
    const text = `[${Array.from({ length: 60_000 }, () => item).join(',')}]`;
    const started = performance.now();
    const result = await run(text);
    const ms = Math.round(performance.now() - started);
    console.info(
      `[benchmark] json.format ${(text.length / 1024 / 1024).toFixed(2)} MB in ${ms} ms`,
    );
    expect(result.ok).toBe(true);
    expect(ms).toBeLessThan(3000);
  });
});
