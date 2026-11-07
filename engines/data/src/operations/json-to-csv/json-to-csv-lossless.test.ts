import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { jsonToCsv } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(jsonToCsv, { text }, params, createTestContext());

describe('data.json.to-csv keeps every digit', () => {
  it('writes a 20-digit ID exactly as given (JSON.parse would print …567000)', async () => {
    const result = await run('[{"id":12345678901234567890,"n":-9007199254740993}]');
    expect(result.ok && result.value.text).toBe('id,n\n12345678901234567890,-9007199254740993\n');
  });

  it('keeps ordinary numbers as numbers', async () => {
    const result = await run('[{"a":1.5,"b":2e3,"c":42}]');
    expect(result.ok && result.value.text).toBe('a,b,c\n1.5,2000,42\n');
  });

  it('keeps big numbers exact inside nested JSON text', async () => {
    const result = await run('[{"ids":[12345678901234567890,1]}]', { nested: 'json' });
    expect(result.ok && result.value.text).toBe('ids\n"[12345678901234567890,1]"\n');
  });

  it('still reports invalid JSON', async () => {
    const result = await run('[{"a":1,}]');
    expect(!result.ok && result.error.code).toBe('DATA_JSON_TO_CSV_INVALID_JSON');
  });
});
