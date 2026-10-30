import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isTourCompleted, markTourCompleted } from './ToolOnboardingTour.tsx';

describe('ToolOnboardingTour persistence', () => {
  let mockStore: Map<string, string>;

  beforeEach(() => {
    mockStore = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, val: string) => {
        mockStore.set(key, String(val));
      },
      removeItem: (key: string) => {
        mockStore.delete(key);
      },
      clear: () => {
        mockStore.clear();
      },
    };

    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('reports incomplete for a new tool on first visit', () => {
    expect(isTourCompleted('gst-calculator')).toBe(false);
  });

  it('marks tour completed and persists in localStorage', () => {
    markTourCompleted('gst-calculator');
    expect(isTourCompleted('gst-calculator')).toBe(true);

    const stored = JSON.parse(mockStore.get('mt.tour.gst-calculator') ?? '{}');
    expect(stored.completed).toBe(true);
    expect(typeof stored.seenAt).toBe('number');
  });

  it('handles isolated tools independently', () => {
    markTourCompleted('gst-calculator');
    expect(isTourCompleted('gst-calculator')).toBe(true);
    expect(isTourCompleted('profit-margin-calculator')).toBe(false);
  });
});
