import { readFileSync } from 'node:fs';
import type { Registry, ResolvedPreset } from '@mangotools/schemas';
import { describe, expect, it } from 'vitest';
import { userPresetsEnabled } from '../../apps/web/src/lib/user-presets.ts';

const withFlag = (userPresets?: boolean) =>
  ({ ui: userPresets === undefined ? {} : { userPresets } }) as ResolvedPreset;

describe('user preset page wiring', () => {
  it('is off when the flag is absent or false', () => {
    expect(userPresetsEnabled(withFlag())).toBe(false);
    expect(userPresetsEnabled(withFlag(false))).toBe(false);
  });

  it('is on only when the flag is true', () => {
    expect(userPresetsEnabled(withFlag(true))).toBe(true);
  });

  it('does not opt any current public preset in', () => {
    const registry = JSON.parse(readFileSync('generated/registry.json', 'utf8')) as Registry;
    expect(Object.values(registry.presets).filter(userPresetsEnabled)).toEqual([]);
  });
});
