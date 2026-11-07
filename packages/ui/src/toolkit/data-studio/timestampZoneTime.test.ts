import { describe, expect, it } from 'vitest';
import { computeTimestamp } from './useTimestampStudio.ts';

describe('timestamp zone tile', () => {
  it('ends with the clock time in the chosen zone, not the year', () => {
    const r = computeTimestamp('1704067200', 'seconds', 'Asia/Kolkata');
    expect(r.selectedTzTime.split(',').pop()?.trim()).toBe('05:30:00');
  });

  it('shows midnight as 00, never 24', () => {
    const r = computeTimestamp('1704067200', 'seconds', 'UTC');
    expect(r.selectedTzTime.split(',').pop()?.trim()).toBe('00:00:00');
  });
});
