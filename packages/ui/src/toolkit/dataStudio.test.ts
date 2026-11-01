import { describe, expect, it } from 'vitest';
import { computeDetailedJsonStats } from './data-studio/jsonStats';
import { analyzeJson, DEFAULT_JSON, sortJsonKeys } from './data-studio/useJsonFormatterStudio';
import { computeTimestamp } from './data-studio/useTimestampStudio';

describe('Data Studio - JSON Tools', () => {
  it('correctly analyzes json objects, arrays, and max depth', () => {
    const sample = {
      user: {
        id: 1,
        profile: { name: 'Alice', active: true },
      },
      tags: ['admin', 'billing'],
    };
    const stats = analyzeJson(sample);
    expect(stats.objects).toBe(3); // root, user, profile
    expect(stats.arrays).toBe(1); // tags
    expect(stats.maxDepth).toBe(3);
  });

  it('computes detailed breakdown matching reference mockup', () => {
    const parsed = JSON.parse(DEFAULT_JSON);
    const detailed = computeDetailedJsonStats(parsed, DEFAULT_JSON);
    expect(detailed.objects).toBe(6);
    expect(detailed.arrays).toBe(2);
    expect(detailed.totalKeys).toBe(19);
    expect(detailed.totalValues).toBe(17);
    expect(detailed.types.strings).toBe(9);
    expect(detailed.types.numbers).toBe(6);
    expect(detailed.types.booleans).toBe(2);
    expect(detailed.types.nulls).toBe(0);
    expect(detailed.maxDepth).toBe(4);
    expect(detailed.bytes).toBeGreaterThan(400);
    expect(detailed.sizeKb).toBe('439 B');
  });

  it('alphabetically sorts json keys recursively', () => {
    const unordered = {
      z: 1,
      a: {
        beta: 2,
        alpha: 1,
      },
      m: [{ d: 4, c: 3 }],
    };
    const sorted = sortJsonKeys(unordered) as Record<string, unknown>;
    expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
    expect(Object.keys(sorted.a as Record<string, unknown>)).toEqual(['alpha', 'beta']);
    expect(Object.keys((sorted.m as Record<string, unknown>[])[0])).toEqual(['c', 'd']);
  });
});

describe('Data Studio - Timestamp Tools', () => {
  it('computes timestamp accurately for epoch 0 and leap years', () => {
    const epochRes = computeTimestamp('0', 'seconds', 'UTC');
    expect(epochRes.utcString).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
    expect(epochRes.isoString).toBe('1970-01-01T00:00:00.000Z');
    expect(epochRes.leapYear).toBe(false);

    // Leap year 2024
    const leapRes = computeTimestamp('1709211600', 'seconds', 'UTC'); // 2024-02-29 13:00:00
    expect(leapRes.leapYear).toBe(true);
  });

  it('handles milliseconds, microseconds, and nanoseconds units', () => {
    const millisRes = computeTimestamp('1704067200000', 'milliseconds', 'UTC');
    expect(millisRes.isoString).toBe('2024-01-01T00:00:00.000Z');

    const microsRes = computeTimestamp('1704067200000000', 'microseconds', 'UTC');
    expect(microsRes.isoString).toBe('2024-01-01T00:00:00.000Z');

    const nanosRes = computeTimestamp('1704067200000000000', 'nanoseconds', 'UTC');
    expect(nanosRes.isoString).toBe('2024-01-01T00:00:00.000Z');
  });

  it('handles invalid timestamp gracefully', () => {
    const invalidRes = computeTimestamp('not-a-number', 'seconds', 'UTC');
    expect(invalidRes.error).not.toBeNull();
    expect(invalidRes.dateObj).toBeNull();
  });
});
