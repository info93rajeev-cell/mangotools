import { createTestContext, executeOperation } from '@mangotools/core';
import { describe, expect, it } from 'vitest';
import { timestampConvert } from './operation.ts';

const run = (text: string, params: Record<string, unknown> = {}) =>
  executeOperation(timestampConvert, { text }, params, createTestContext());

describe('data.timestamp.convert — timestamp to date', () => {
  it('converts Unix seconds to a UTC ISO string', async () => {
    const result = await run('1700000000');
    expect(result.ok && result.value.isoString).toBe('2023-11-14T22:13:20.000Z');
    expect(result.ok && result.value.detectedUnit).toBe('seconds');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
    expect(result.ok && result.value.unixMilliseconds).toBe(1700000000000);
  });

  it('converts Unix milliseconds to the same UTC instant', async () => {
    const result = await run('1700000000000');
    expect(result.ok && result.value.isoString).toBe('2023-11-14T22:13:20.000Z');
    expect(result.ok && result.value.detectedUnit).toBe('milliseconds');
  });

  it('respects an explicit unit override even against auto-detect digit counts', async () => {
    const result = await run('1700000000', { unit: 'milliseconds' });
    expect(result.ok && result.value.isoString).toBe('1970-01-20T16:13:20.000Z');
    expect(result.ok && result.value.detectedUnit).toBe('milliseconds');
  });

  it('floors fractional seconds when reporting unix seconds from a millisecond value', async () => {
    const result = await run('1700000000123');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
    expect(result.ok && result.value.unixMilliseconds).toBe(1700000000123);
  });

  it('the local display always matches this same process own local-time rendering (timezone-safe)', async () => {
    const result = await run('1700000000');
    const expected = new Date(1700000000000).toString();
    expect(result.ok && result.value.localDisplay).toBe(expected);
  });

  it('the UTC display uses toUTCString', async () => {
    const result = await run('0');
    expect(result.ok && result.value.utcDisplay).toBe(new Date(0).toUTCString());
  });

  it('rejects a non-integer timestamp', async () => {
    const result = await run('1700000000.5');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_INVALID');
  });

  it('rejects text that is not a number at all', async () => {
    const result = await run('not-a-timestamp');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_INVALID');
  });

  it('rejects an ambiguous 11-12 digit value under auto-detect', async () => {
    const result = await run('12345678901');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_AMBIGUOUS_LENGTH');
    expect(!result.ok && result.error.details).toEqual({ digits: 11 });
  });

  it('rejects a timestamp outside the JS Date range', async () => {
    const result = await run('99999999999999999999999999999', { unit: 'milliseconds' });
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_OUT_OF_RANGE');
  });

  it('rejects empty input', async () => {
    const result = await run('   ');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_EMPTY');
  });

  it('accepts a negative (pre-1970) timestamp', async () => {
    const result = await run('-86400');
    expect(result.ok && result.value.isoString).toBe('1969-12-31T00:00:00.000Z');
    expect(result.ok && result.value.detectedUnit).toBe('seconds');
  });
});

describe('data.timestamp.convert — date to timestamp', () => {
  const toTimestamp = (text: string, basis?: 'local' | 'utc') =>
    run(text, { direction: 'to-timestamp', ...(basis ? { basis } : {}) });

  it('converts an explicit-Z ISO date-time to Unix seconds and milliseconds', async () => {
    const result = await toTimestamp('2023-11-14T22:13:20Z');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
    expect(result.ok && result.value.unixMilliseconds).toBe(1700000000000);
    expect(result.ok && result.value.text).toBe('1700000000');
    expect(result.ok && result.value.interpretedBasis).toBe('utc');
  });

  it('supports fractional-second milliseconds', async () => {
    const result = await toTimestamp('2023-11-14T22:13:20.123Z');
    expect(result.ok && result.value.unixMilliseconds).toBe(1700000000123);
  });

  it('interprets a zone-less date-time as UTC when basis is utc', async () => {
    const result = await toTimestamp('2023-11-14T22:13:20', 'utc');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
    expect(result.ok && result.value.interpretedBasis).toBe('utc');
  });

  it('a trailing Z always wins over the basis param', async () => {
    const result = await toTimestamp('2023-11-14T22:13:20Z', 'local');
    expect(result.ok && result.value.interpretedBasis).toBe('utc');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
  });

  it('interprets a zone-less date-time as local time when basis is local (timezone-safe)', async () => {
    const result = await toTimestamp('2023-11-14T22:13:20', 'local');
    const expectedMs = new Date(2023, 10, 14, 22, 13, 20).getTime();
    expect(result.ok && result.value.unixMilliseconds).toBe(expectedMs);
    expect(result.ok && result.value.interpretedBasis).toBe('local');
  });

  it('accepts a date-only input, defaulting the time to midnight', async () => {
    const result = await toTimestamp('2023-11-14', 'utc');
    expect(result.ok && result.value.isoString).toBe('2023-11-14T00:00:00.000Z');
  });

  it('accepts a space separator in place of T', async () => {
    const result = await toTimestamp('2023-11-14 22:13:20Z');
    expect(result.ok && result.value.unixSeconds).toBe(1700000000);
  });

  it('rejects an unsupported format', async () => {
    const result = await toTimestamp('November 14, 2023');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_UNSUPPORTED_FORMAT');
  });

  it('rejects a day that does not exist (Feb 30), not silently rolling it over', async () => {
    const result = await toTimestamp('2023-02-30', 'utc');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_INVALID_DATE');
  });

  it('rejects a month out of range', async () => {
    const result = await toTimestamp('2023-13-01', 'utc');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_INVALID_DATE');
  });

  it('rejects an hour, minute or second out of range', async () => {
    expect((await toTimestamp('2023-11-14T24:00:00', 'utc')).ok).toBe(false);
    expect((await toTimestamp('2023-11-14T10:99:00', 'utc')).ok).toBe(false);
    expect((await toTimestamp('2023-11-14T10:00:99', 'utc')).ok).toBe(false);
  });

  it('rejects empty input', async () => {
    const result = await toTimestamp('   ');
    expect(!result.ok && result.error.code).toBe('DATA_TIMESTAMP_EMPTY');
  });
});
