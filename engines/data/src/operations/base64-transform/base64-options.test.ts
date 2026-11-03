import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { base64Transform } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(base64Transform, { text }, params, createTestContext());

const PNG_HEAD = '\x89PNG\r\n\x1a\n\x00\x00';

describe('data.base64.transform options', () => {
  it('reports the input byte length for encode and decode', async () => {
    const enc = await run('₹');
    expect(enc.ok && enc.value.inputByteLength).toBe(3);
    const dec = await run('4oK5', { direction: 'decode' });
    expect(dec.ok && dec.value.inputByteLength).toBe(4);
  });

  it('encodes latin1 text one byte per character and rejects wider characters', async () => {
    const ok = await run('é', { charset: 'latin1' });
    expect(ok.ok && ok.value.text).toBe('6Q==');
    const bad = await run('₹', { charset: 'latin1' });
    expect(!bad.ok && bad.error.code).toBe('DATA_BASE64_NOT_LATIN1');
  });

  it('wraps the result as a data URI without line breaks', async () => {
    const result = await run('hi', { dataUriMime: 'text/plain;charset=utf-8', lineLength: '76' });
    expect(result.ok && result.value.text).toBe('data:text/plain;charset=utf-8;base64,aGk=');
  });

  it('accepts a data URI prefix on decode only when asked', async () => {
    const plain = await run('data:text/plain;base64,aGk=', { direction: 'decode' });
    expect(plain.ok).toBe(false);
    const stripped = await run('data:text/plain;base64,aGk=', {
      direction: 'decode',
      stripDataUri: true,
    });
    expect(stripped.ok && stripped.value.text).toBe('hi');
    expect(stripped.ok && stripped.value.mime).toBe('text/plain');
  });

  it('recognises a PNG and returns its bytes for preview', async () => {
    const b64 = await run(PNG_HEAD, { charset: 'latin1' });
    const text = b64.ok ? b64.value.text : '';
    const dec = await run(text, { direction: 'decode' });
    expect(dec.ok && dec.value.mime).toBe('image/png');
    expect(dec.ok && dec.value.isUtf8).toBe(false);
    expect(dec.ok && dec.value.binary).toBe(PNG_HEAD);
  });

  it('decodes to latin1 bytes when asked, even for valid UTF-8', async () => {
    const dec = await run('4oK5', { direction: 'decode', charset: 'latin1' });
    expect(dec.ok && dec.value.binary).toBe('\xe2\x82\xb9');
  });
});
