import { expect, it } from 'vitest';
import { parsePresets, resolveExtends } from '../../scripts/generate/presets.ts';
import { loadSources } from '../../scripts/generate/sources.ts';

const { sources } = loadSources();
const { raw } = parsePresets(sources.presets);
const resolved = resolveExtends('image/passport-photo', raw);
if (!('preset' in resolved)) throw new Error(resolved.problem.message);
const preset = resolved.preset;

it('reuses the exact existing resize contract without an official size or byte-target field', () => {
  const base = resolveExtends('image/resize', raw);
  if (!('preset' in base)) throw new Error(base.problem.message);
  expect(preset.operation).toBe('image.resize@1');
  expect(Object.keys(preset.fields ?? {})).toEqual(Object.keys(base.preset.fields ?? {}));
  expect(preset.fields?.targetWidth).toEqual(base.preset.fields?.targetWidth);
  expect(preset.fields?.targetHeight).toEqual(base.preset.fields?.targetHeight);
  expect(preset.fields?.keepAspectRatio?.default).toBe('true');
});

it('uses explicit editable JPG quality and a passport-specific download name', () => {
  expect(preset.fields?.outputFormat?.default).toBe('jpg');
  expect(preset.fields?.quality?.default).toBe(85);
  expect(preset.params).toEqual({
    outputFileNameSuffix: '-passport',
    outputFileNameFallback: 'passport-photo',
  });
  expect(preset.ui?.fileAccept).toBe('image/jpeg,image/png,image/webp');
  expect(preset.ui?.maxFiles).toBe(1);
});
