import { describe, expect, it } from 'vitest';
import { processingOf } from './processing.ts';

describe('processingOf', () => {
  it('is device only when no network is declared and the operation runs in a browser worker', () => {
    expect(processingOf({ dataClass: 'public', network: 'none' }, ['worker', 'node'])).toBe(
      'device',
    );
    expect(processingOf({ dataClass: 'personal', network: 'none' }, ['worker'])).toBe('device');
  });

  it('is network when the tool declares network use, whatever the runtime', () => {
    expect(processingOf({ dataClass: 'public', network: 'declared' }, ['worker'])).toBe('network');
  });

  it('is unverified when the operation cannot run in the browser', () => {
    expect(processingOf({ dataClass: 'public', network: 'none' }, ['node'])).toBe('unverified');
  });

  it('does not depend on dataClass (sensitivity is not evidence of local processing)', () => {
    for (const dataClass of ['public', 'personal', 'sensitive'] as const) {
      expect(processingOf({ dataClass, network: 'declared' }, ['worker'])).toBe('network');
    }
  });
});
