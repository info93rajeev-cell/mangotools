import { describe, expect, it } from 'vitest';
import { countHits, makeMatcher, subtreeHasHit } from './jsonSearch.ts';

const data = {
  user: { name: 'John Doe', email: 'john@example.com', age: 30 },
  tags: ['a', 'john'],
};

describe('json search', () => {
  it('matches keys and values, case-insensitive by default', () => {
    const { matcher } = makeMatcher('john', false, false);
    expect(countHits(data, matcher)).toBe(3);
  });

  it('respects match case', () => {
    const { matcher } = makeMatcher('John', true, false);
    expect(countHits(data, matcher)).toBe(1);
  });

  it('supports regex and reports invalid patterns', () => {
    // 30, plus the array indices "0" and "1" shown as keys in the tree
    expect(countHits(data, makeMatcher('^\\d+$', false, true).matcher)).toBe(3);
    const bad = makeMatcher('(', false, true);
    expect(bad.matcher).toBeNull();
    expect(bad.error).toBe('Invalid regular expression');
  });

  it('matches keys', () => {
    expect(countHits(data, makeMatcher('email', false, false).matcher)).toBe(1);
  });

  it('empty query has no matcher', () => {
    expect(makeMatcher('  ', false, false).matcher).toBeNull();
    expect(subtreeHasHit(data, null)).toBe(false);
  });
});
