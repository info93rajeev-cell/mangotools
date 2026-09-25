import { z } from 'zod';

export const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase kebab-case (a-z, 0-9, single hyphens).');
export const semver = z.string().regex(/^\d+\.\d+\.\d+$/, 'Use semantic versioning, e.g. 0.1.0.');
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
export const presetId = z
  .string()
  .regex(
    /^[a-z0-9]+\/[a-z0-9]+([.-][a-z0-9]+)*$/,
    'Preset ids look like engine/name or engine/name.variant.',
  );
export const operationRef = z
  .string()
  .regex(
    /^[a-z0-9]+(\.[a-z0-9-]+)+@[1-9][0-9]*$/,
    'Operation references look like engine.domain.verb@1.',
  );

export const lengthBetween = (min: number, max: number, what: string) =>
  z.string().refine((s) => [...s].length >= min && [...s].length <= max, {
    message: `${what} must be ${min}–${max} characters.`,
  });
