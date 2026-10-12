import type { ResolvedPreset } from '@mangotools/schemas';

/** Public calculators show the local preset manager only after an explicit preset opt-in. */
export const userPresetsEnabled = (preset: ResolvedPreset): boolean =>
  preset.ui.userPresets === true;
