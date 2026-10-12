import { describe, expect, it } from 'vitest';
import { presetSchema } from './preset.ts';

const preset = (userPresets?: unknown) => ({
  presetVersion: 1,
  id: 'estimate/example',
  version: '0.1.0',
  operation: 'estimate.example.value@1',
  ui: {
    archetypes: ['B'],
    ...(userPresets === undefined ? {} : { userPresets }),
  },
});

describe('preset user-presets opt-in', () => {
  it('keeps an omitted flag backward compatible', () => {
    expect(presetSchema.safeParse(preset()).success).toBe(true);
  });

  it('accepts explicit false and true', () => {
    expect(presetSchema.parse(preset(false)).ui?.userPresets).toBe(false);
    expect(presetSchema.parse(preset(true)).ui?.userPresets).toBe(true);
  });

  it('rejects a non-boolean flag', () => {
    expect(presetSchema.safeParse(preset('true')).success).toBe(false);
  });
});
