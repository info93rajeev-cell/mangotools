import { describe, expect, it } from 'vitest';
import { privacyBadge } from './privacyBadge.ts';

describe('privacyBadge', () => {
  it('shows "Runs on your device" for tools processed on the device', () => {
    expect(privacyBadge('device')).toEqual({
      label: 'Runs on your device',
      detail: 'Processed locally in your browser. Nothing is uploaded.',
    });
  });

  it('shows no badge for a tool that declares network use or cannot run in the browser', () => {
    expect(privacyBadge('network')).toBeNull();
    expect(privacyBadge('unverified')).toBeNull();
  });
});
